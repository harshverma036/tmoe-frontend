import DataTable from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import React from 'react'

const Users = () => {
  return (
    <div>
      <DataTable
        columns={[{
          accessorKey: 'name',
          header: 'Name',
        },
        {
          accessorKey: 'email',
          header: 'Email',
        }, {
          accessorKey: 'Role',
          header: 'Role',
        }, {
          accessorKey: 'status',
          header: 'Status',
        }, {
          accessorKey: 'createdAt',
          header: 'Created At',
        }, {
          accessorKey: 'email_verified',
          header: 'Email Verified',
        }, {
          accessorKey: 'actions',
          header: 'Actions',
        }]}
        title="Users"
        data={[{
          name: 'John Doe',
          email: 'john.doe@example.com',
          Role: 'Admin',
          status: 'Active',
          createdAt: '2021-01-01',
          email_verified: true,
          actions: <Button>View</Button>,
        }, 
        {
          name: 'John Doe',
          email: 'john.doe@example.com',
          Role: 'Admin',
          status: 'Active',
          createdAt: '2021-01-01',
          email_verified: true,
          actions: <Button>View</Button>,
        }, {
          name: 'John Doe',
          email: 'john.doe@example.com',
          Role: 'Admin',
          status: 'Active',
          createdAt: '2021-01-01',
          email_verified: true,
          actions: <Button>View</Button>,
        }, {
          name: 'John Doe',
          email: 'john.doe@example.com',
          Role: 'Admin',
          status: 'Active',
          createdAt: '2021-01-01',
          email_verified: true,
          actions: <Button>View</Button>,
        }]}
        pagination={{
          pageIndex: 0,
          pageSize: 10,
        }}
        totalCount={0}
        count={0}
      />
    </div>
  )
}

export default Users