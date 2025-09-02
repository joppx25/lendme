import { ProfileCard } from "@/components/profile/ProfileCard";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const currentUser = await getCurrentSession();

  if (!currentUser) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and personal information.
          </p>
        </div>
        
        <ProfileCard user={currentUser} />
      </div>
    </div>
  );
}
