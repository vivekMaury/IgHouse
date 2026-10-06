import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const UPSTASH_REDIS_REST_URL = Deno.env.get('UPSTASH_REDIS_REST_URL') || '';
const UPSTASH_REDIS_REST_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function processEvent(eventStr: string) {
  const event = JSON.parse(eventStr);
  const parsedEvent = typeof event === 'string' ? JSON.parse(event) : event; // depending on Upstash format
  
  // This is a simplified parsing of Meta's webhook payload
  for (const entry of parsedEvent.entry || []) {
    for (const messaging of entry.messaging || []) {
      const senderId = messaging.sender?.id;
      const recipientId = messaging.recipient?.id;
      const messageText = messaging.message?.text;

      if (!senderId || !messageText) continue;

      // 1. Find the IG Account
      const { data: igAccount } = await supabase
        .from('ig_accounts')
        .select('id')
        .eq('instagram_page_id', recipientId)
        .single();
      
      if (!igAccount) continue;

      // 2. Upsert Contact and update last_interaction_at
      const { data: contact } = await supabase
        .from('contacts')
        .upsert({
          ig_account_id: igAccount.id,
          ig_scoped_user_id: senderId,
          last_interaction_at: new Date().toISOString()
        }, { onConflict: 'ig_account_id, ig_scoped_user_id' })
        .select('id, last_interaction_at')
        .single();
      
      if (!contact) continue;

      // 3. Save incoming message
      await supabase
        .from('conversations')
        .insert({
          contact_id: contact.id,
          direction: 'inbound',
          message_body: messageText
        });

      // 4. Trigger Flows or AI Response
      // Logic for 24-hour interaction check before outbound messages:
      const interactionLimit = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const lastInteraction = new Date(contact.last_interaction_at);
      
      if (lastInteraction > interactionLimit) {
        // Safe to send outbound message
        console.log(`Contact ${contact.id} is within the 24-hour window.`);
        // Add logic to trigger flow or AI response here
      } else {
        console.log(`Contact ${contact.id} is outside the 24-hour window. Message failed.`);
      }
    }
  }
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  // 1. Pop from Upstash Queue
  const popUrl = `${UPSTASH_REDIS_REST_URL}/rpop/webhook_queue`;
  const popResponse = await fetch(popUrl, {
    headers: { 'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}` }
  });
  
  const popData = await popResponse.json();
  const eventStr = popData.result; // Upstash returns value in 'result'

  if (eventStr) {
    try {
      await processEvent(eventStr);
      return new Response('Processed', { status: 200 });
    } catch (e) {
      console.error('Error processing event:', e);
      return new Response('Processing Error', { status: 500 });
    }
  }

  return new Response('Queue Empty', { status: 200 });
});
