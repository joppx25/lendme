import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Borrowers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">128</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active Loans</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">₱1,250,000</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Savings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">₱450,000</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Overdue Loans</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">₱75,000</p>
        </CardContent>
      </Card>
    </div>
  );
}
