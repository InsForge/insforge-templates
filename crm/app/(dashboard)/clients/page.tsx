import { getAccessToken } from '@/lib/auth-cookies';
import { getClients } from '@/lib/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function ClientsPage() {
  const token = await getAccessToken();
  const { clients, count } = await getClients(token);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground">{count} total clients</p>
        </div>
        <Link href="/clients/add">
          <Button><Plus className="mr-2 h-4 w-4" />New Client</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {clients.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No clients yet. Convert a lead or create a client directly.
            </div>
          ) : (
            <div className="divide-y">
              {clients.map((client: Record<string, unknown>) => (
                <div key={client.id as string} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{client.name as string}</p>
                    <p className="text-sm text-muted-foreground">Code: {client.client_code as string}</p>
                  </div>
                  <Badge variant={(client.is_active as boolean) ? 'default' : 'secondary'}>
                    {(client.is_active as boolean) ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
