'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ProfileSection({ user }: { user: { email: string; name: string } }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input value={user.name} readOnly />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={user.email} readOnly />
        </div>
      </CardContent>
    </Card>
  );
}
