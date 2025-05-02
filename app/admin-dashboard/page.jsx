"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Users, CreditCard, Activity } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <>
      <h1 className='text-2xl font-bold mb-6'>Dashboard Overview</h1>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle className='text-sm'>Total Revenue</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>$12,450</div>
            <p className='text-sm text-muted-foreground'>
              +18.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle className='text-sm'>Active Users</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>2,301</div>
            <p className='text-sm text-muted-foreground'>+3.1% this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle className='text-sm'>Transactions</CardTitle>
            <CreditCard className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>845</div>
            <p className='text-sm text-muted-foreground'>+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle className='text-sm'>Analytics</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>68%</div>
            <p className='text-sm text-muted-foreground'>Stable</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
