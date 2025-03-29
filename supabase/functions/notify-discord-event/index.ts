// This import is for Supabase Edge Functions
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL');

// Type definition for the Supabase webhook payload
type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: any;
  old_record: any | null;
};

// Note: The linter may show errors for Deno, but this will work in Supabase Edge Functions
Deno.serve(async (req) => {
  if (req.method === 'POST') {
    try {
      const payload: WebhookPayload = await req.json();

      // Only process INSERT events
      if (payload.type !== 'INSERT') {
        return new Response('Only INSERT events are accepted', { status: 400 });
      }

      // Extract event data from the record
      const event = payload.record;

      // Build a Discord embed with polish language interface
      const embed = {
        title: `Nowe wydarzenie: ${event.title}`,
        description: event.description || 'Brak opisu',
        url: event.url || '',
        color: 3447003, // Blue color
        fields: [
          {
            name: 'Rozpoczyna się',
            value: new Date(event.starts_at).toLocaleString('pl-PL'),
            inline: true,
          },
          {
            name: 'Kończy się',
            value: new Date(event.ends_at).toLocaleString('pl-PL'),
            inline: true,
          },
          {
            name: 'Lokalizacja',
            value: event.location || 'Nie podano',
            inline: false,
          },
          {
            name: 'Kategoria',
            value: event.category_id || 'Nie podano',
            inline: true,
          },
          {
            name: 'Organizacja',
            value: event.organization_id || 'Nie podano',
            inline: true,
          },
        ],
        image: event.image_url ? { url: event.image_url } : undefined,
        footer: {
          text: event.verified ? 'Zweryfikowane' : 'Niezweryfikowane',
          timestamp: new Date().toISOString(),
        },
      };

      const discordPayload = {
        embeds: [embed],
        username: 'Event Notifier',
        avatar_url: 'https://supabase.com/favicon/favicon-32x32.png',
      };

      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discordPayload),
      });

      if (response.ok) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Powiadomienie wysłane pomyślnie!',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } else {
        const errorText = await response.text();
        console.error('Discord API error:', errorText);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Nie udało się wysłać powiadomienia do Discord',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
  return new Response(
    JSON.stringify({ success: false, error: 'Metoda niedozwolona' }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    }
  );
});
