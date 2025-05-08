"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Users, CreditCard, Activity } from "lucide-react";

export default function SupplierDashboardPage() {
  return (
    <>
      <h1 className='text-2xl font-bold mb-6'>Supplier Dashboard</h1>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle className='text-sm'>Total Sales</CardTitle>
            {/* <DollarSign className='h-4 w-4 text-muted-foreground' /> */}
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0</div>
            <p className='text-sm text-muted-foreground'>0% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle className='text-sm'>RFQs Received</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0</div>
            <p className='text-sm text-muted-foreground'>0% this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle className='text-sm'>Completed Orders</CardTitle>
            <CreditCard className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0</div>
            <p className='text-sm text-muted-foreground'>0% this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle className='text-sm'>Response Rate</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0%</div>
            <p className='text-sm text-muted-foreground'>
              Compared to last week
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
