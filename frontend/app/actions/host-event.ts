"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type HostEventState = {
    error?: string;
    success?: string;
    fields?: {
        eventTitle: string;
        proposedDate: string;
        description: string;
        contactNumber: string;
    };
};

export async function submitHostRequest(
    prevState: HostEventState,
    formData: FormData
): Promise<HostEventState> {
    const supabase = await createClient();

    // 1. Authenticate User
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "You must be logged in to host an event." };
    }

    const eventTitle = formData.get("eventTitle") as string;
    const proposedDate = formData.get("proposedDate") as string;
    const description = formData.get("description") as string;
    const contactNumber = formData.get("contactNumber") as string;

    // Basic Validation
    if (!eventTitle || !proposedDate || !description || !contactNumber) {
        return {
            error: "All fields are required.",
            fields: { eventTitle, proposedDate, description, contactNumber },
        };
    }

    try {
        // 2. GATEKEEPER CHECK
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("yi_vertical, yi_position")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            return { error: "Could not fetch user profile. Please try again." };
        }

        if (!profile.yi_vertical || !profile.yi_position) {
            return {
                error:
                    "You must update your Profile with your Vertical and Position before hosting an event.",
                fields: { eventTitle, proposedDate, description, contactNumber },
            };
        }

        // 3. TEAM SNAPSHOT (The Magic Step)
        const currentVertical = profile.yi_vertical;

        // Query profiles to get all members of this vertical
        const { data: verticalMembers, error: membersError } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("yi_vertical", currentVertical);

        // Handle members error gracefully? Or strict? 
        // We'll proceed even if empty, but log error.
        if (membersError) {
            console.error("Error fetching vertical members:", membersError);
        }

        const memberNames = verticalMembers?.map((p) => p.full_name).filter(Boolean) || [];

        // 4. Insert Data
        const { error: insertError } = await supabase.from("host_requests").insert({
            user_id: user.id,
            proposed_title: eventTitle,
            proposed_date: proposedDate,
            contact_number: contactNumber,
            description: description,
            host_vertical: currentVertical,
            vertical_members: memberNames,
            status: "pending",
        });

        if (insertError) {
            console.error("Insert Error:", insertError);
            return {
                error: "Failed to submit proposal. Please try again later.",
                fields: { eventTitle, proposedDate, description, contactNumber },
            };
        }

        revalidatePath("/dashboard");

        return {
            success: `Proposal submitted for ${currentVertical} with ${memberNames.length} team members included!`
        };

    } catch (err) {
        console.error("Unexpected Error:", err);
        return { error: "An unexpected error occurred." };

    }
}

export async function approveHostRequest(requestId: string): Promise<{ success?: string; error?: string }> {
    const supabase = await createClient();

    // 1. Authenticate & Authorize (Basic check for now, can be improved with Admin roles later)
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    try {
        // 2. Fetch the Host Request
        const { data: request, error: fetchError } = await supabase
            .from("host_requests")
            .select("*")
            .eq("id", requestId)
            .single();

        if (fetchError || !request) {
            return { error: "Request not found." };
        }

        if (request.status === 'approved') {
            return { error: "Request is already approved." };
        }

        // 3. Transform Date
        // Explicitly set time to 09:00 AM local/ISO as requested
        const startTime = new Date(`${request.proposed_date}T09:00:00`).toISOString();

        // 4. Insert into Events
        const { error: insertError } = await supabase.from("events").insert({
            title: request.proposed_title,
            description: request.description,
            start_time: startTime, // 09:00 AM
            // end_time: null, // Optional, can leave null
            location_name: "TBD", // Placeholder
            image_url: "https://placehold.co/1200x500/18181b/ffffff?text=New+Event", // Generic placeholder
            category: request.host_vertical, // Use the vertical as category
            is_featured: false,
            created_by: request.user_id, // The original requester is the creator? Or current admin? Usually requester.
            // SNAPSHOT DATA TRANSFER
            host_vertical: request.host_vertical,
            vertical_members: request.vertical_members
        });

        if (insertError) {
            console.error("Event Creation Error:", insertError);
            return { error: "Failed to create event from request." };
        }

        // 5. Update Request Status
        const { error: updateError } = await supabase
            .from("host_requests")
            .update({ status: "approved" })
            .eq("id", requestId);

        if (updateError) {
            console.error("Status Update Error:", updateError);
            // Note: Event was created but status update failed. 
            // Ideally we'd rollback, but without transactions we just report warning or error.
            return { error: "Event created, but failed to update request status." };
        }

        revalidatePath("/dashboard");
        revalidatePath(`/events`); // Revalidate events list
        return { success: "Event approved and published successfully!" };

    } catch (err) {
        console.error("Approval Error:", err);
        return { error: "An unexpected error occurred." };
    }
}
