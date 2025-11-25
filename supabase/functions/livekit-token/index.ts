import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AccessToken } from "npm:livekit-server-sdk@2.9.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TokenRequest {
  roomName: string;
  participantName: string;
  participantMetadata?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { roomName, participantName, participantMetadata }: TokenRequest = await req.json();

    if (!roomName || !participantName) {
      return new Response(
        JSON.stringify({ error: "roomName and participantName are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get LiveKit credentials from environment variables
    const apiKey = Deno.env.get("LIVEKIT_API_KEY");
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");

    if (!apiKey || !apiSecret) {
      console.error("Missing LiveKit credentials");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create access token for the participant
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      // Token is valid for 1 hour
      ttl: "1h",
    });

    // Grant permissions
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    // Add metadata if provided
    if (participantMetadata) {
      at.metadata = participantMetadata;
    }

    // Generate the JWT token
    const token = await at.toJwt();

    return new Response(
      JSON.stringify({ token }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating token:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate token" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
