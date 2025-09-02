'use server';

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { ContributionType, ContributionStatus, PaymentMethod } from "@/generated/prisma";

const contributionSchema = z.object({
  amount: z.string().transform((val) => parseFloat(val)).pipe(
    z.number().positive("Amount must be positive").min(100, "Minimum contribution is ₱100")
  ),
  contributionType: z.nativeEnum(ContributionType),
  paymentMethod: z.nativeEnum(PaymentMethod),
  receiptNumber: z.string().optional(),
  description: z.string().optional(),
  contributorId: z.string().optional(), // For admin-created contributions
});

export async function makeContribution(state: any, formData: FormData) {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    const validatedFields = contributionSchema.safeParse({
      amount: formData.get('amount'),
      contributionType: formData.get('contributionType'),
      paymentMethod: formData.get('paymentMethod'),
      receiptNumber: formData.get('receiptNumber'),
      description: formData.get('description'),
      contributorId: formData.get('contributorId'),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { amount, contributionType, paymentMethod, receiptNumber, description, contributorId } = validatedFields.data;

    // Determine the actual contributor
    let actualContributorId = currentUser.id;
    
    // If admin is creating contribution for another user
    if (contributorId && ['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
      // Verify the target user exists and is a borrower or guest
      const targetUser = await prisma.users.findUnique({
        where: { id: contributorId }
      });
      
      if (!targetUser) {
        return {
          success: false,
          errors: {
            contributorId: ["Selected user not found"],
          },
        };
      }
      
      if (!['BORROWER', 'GUEST'].includes(targetUser.role)) {
        return {
          success: false,
          errors: {
            contributorId: ["Can only create contributions for borrowers and guests"],
          },
        };
      }
      
      actualContributorId = contributorId;
    }

    // Create contribution
    const contribution = await prisma.contributions.create({
      data: {
        contributorId: actualContributorId,
        amount,
        contributionType,
        paymentMethod,
        receiptNumber: receiptNumber || null,
        description: description || null,
        status: ContributionStatus.PENDING,
        contributedAt: new Date(),
        processedBy: actualContributorId !== currentUser.id ? currentUser.id : null, // Mark who created it if admin
      },
    });

    revalidatePath('/contributions');
    return {
      success: true,
      message: `Contribution of ₱${amount.toLocaleString()} submitted successfully and is pending approval.`,
      contributionId: contribution.id,
    };

  } catch (error) {
    console.error('Contribution error:', error);
    return {
      success: false,
      message: "Failed to submit contribution",
    };
  }
}

export async function approveContribution(contributionId: string) {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser || !['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
      throw new Error('Unauthorized');
    }

    const contribution = await prisma.contributions.update({
      where: { id: contributionId },
      data: {
        status: ContributionStatus.APPROVED,
        processedAt: new Date(),
        processedBy: currentUser.id,
      },
    });

    // Update fund balance
    const fundBalance = await prisma.fundBalance.findFirst();
    if (fundBalance) {
      await prisma.fundBalance.update({
        where: { id: fundBalance.id },
        data: {
          totalFunds: { increment: parseFloat(contribution.amount.toString()) },
          availableFunds: { increment: parseFloat(contribution.amount.toString()) },
          totalContributions: { increment: parseFloat(contribution.amount.toString()) },
          lastUpdated: new Date(),
        },
      });
    }

    revalidatePath('/contributions');
    return { success: true };

  } catch (error) {
    console.error('Contribution approval error:', error);
    throw error;
  }
}

export async function rejectContribution(contributionId: string) {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser || !['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
      throw new Error('Unauthorized');
    }

    await prisma.contributions.update({
      where: { id: contributionId },
      data: {
        status: ContributionStatus.REJECTED,
        processedAt: new Date(),
        processedBy: currentUser.id,
      },
    });

    revalidatePath('/contributions');
    return { success: true };

  } catch (error) {
    console.error('Contribution rejection error:', error);
    throw error;
  }
}

export async function getContributionUsers() {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser || !['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
      return [];
    }

    // Get all borrowers and guests
    const users = await prisma.users.findMany({
      where: {
        role: {
          in: ['BORROWER', 'GUEST']
        },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return users;

  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}
