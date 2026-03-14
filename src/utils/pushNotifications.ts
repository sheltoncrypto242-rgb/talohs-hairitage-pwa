import { supabase } from "../lib/supabase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPush(userId: string) {
  console.log("Starting push registration for user:", userId);

  if (!VAPID_PUBLIC_KEY) {
    console.error("VAPID_PUBLIC_KEY is not set in environment variables");
    return;
  }

  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log("Push notifications not supported");
    return;
  }

  if (Notification.permission === "denied") {
    console.log("Push notifications denied by user");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    console.log("Service worker ready");

    let subscription = await registration.pushManager.getSubscription();
    console.log("Existing subscription:", subscription ? "Yes" : "No");

    // Handle permission
    if (Notification.permission === "granted") {
      // Create new subscription if none exists
      if (!subscription) {
        console.log("Creating new push subscription...");
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
          console.log("New subscription created");
        } catch (subError) {
          console.error("Error creating subscription:", subError);
          return;
        }
      }

      // Save to database - but first check if it already exists
      if (subscription) {
        const { endpoint, keys } = subscription.toJSON();
        console.log("Checking if subscription exists in DB");
        
        // Check if this exact subscription already exists for this user
        const { data: existingSubs, error: fetchError } = await supabase
          .from("push_subscriptions")
          .select("id")
          .eq("user_id", userId)
          .eq("endpoint", endpoint);

        if (fetchError) {
          console.error("Error checking existing subscription:", fetchError);
        }

        // Only save if it doesn't exist
        if (!existingSubs || existingSubs.length === 0) {
          console.log("Saving new subscription to DB");
          
          const { error: insertError } = await supabase
            .from("push_subscriptions")
            .insert({
              user_id: userId,
              endpoint,
              p256dh: keys?.p256dh,
              auth: keys?.auth,
              user_agent: navigator.userAgent,
              created_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error("Error inserting subscription:", insertError);
          } else {
            console.log("Subscription saved successfully");
          }
        } else {
          console.log("Subscription already exists in DB, skipping save");
          
          // Optional: Update the existing subscription's timestamp or user_agent
          const { error: updateError } = await supabase
            .from("push_subscriptions")
            .update({
              user_agent: navigator.userAgent,
            })
            .eq("user_id", userId)
            .eq("endpoint", endpoint);

          if (updateError) {
            console.error("Error updating subscription:", updateError);
          }
        }
      }
    } else if (Notification.permission === "default") {
      console.log("Requesting notification permission...");
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // Retry registration
        return registerPush(userId);
      }
    }
  } catch (error) {
    console.error("Error in push registration:", error);
  }
}

export async function unregisterPush(userId: string) {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
    }

    // Delete all subscriptions for this user
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId);
    
    if (error) {
      console.error("Error deleting subscriptions:", error);
    } else {
      console.log("Push unregistered successfully");
    }
  } catch (error) {
    console.error("Error unregistering push:", error);
  }
}

// Add a function to check subscription status
export async function checkPushStatus(userId: string) {
  try {
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error checking push status:", error);
      return { subscribed: false, error };
    }

    return { 
      subscribed: data && data.length > 0, 
      subscriptions: data 
    };
  } catch (error) {
    console.error("Error:", error);
    return { subscribed: false, error };
  }
}