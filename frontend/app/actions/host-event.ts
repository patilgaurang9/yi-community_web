"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type HostEventState = {
    error?: string;
    success?: string;
    fields?: {
        eventTitle: string;
        start_time: string;
        end_time: string;
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
    const description = formData.get("description") as string;
    const contactNumber = formData.get("contactNumber") as string;
    const category = formData.get("category") as string;
    const start_time = formData.get("start_time") as string;
    const end_time = formData.get("end_time") as string;
    const locationName = formData.get("locationName") as string;
    const coverPhotoUrl = formData.get("coverPhotoUrl") as string;
    const galleryPhotoUrlsRaw = formData.get("galleryPhotoUrls") as string;

    // Parse gallery URLs safely
    let galleryUrls: string[] = [];
    try {
        if (galleryPhotoUrlsRaw) {
            galleryUrls = JSON.parse(galleryPhotoUrlsRaw);
        }
    } catch (e) {
        console.error("Failed to parse gallery URLs", e);
    }

    // Basic Validation
    if (!eventTitle || !description || !contactNumber || !start_time || !locationName || !category) {
        return {
            error: "Please fill in all required fields.",
            fields: { eventTitle, start_time, end_time, description, contactNumber },
        };
    }

    try {
        // 2. GATEKEEPER CHECK & TEAM SNAPSHOT
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("yi_vertical, yi_position, vertical_id")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            return { error: "Could not fetch user profile. Please try again." };
        }

        // Strict Check: Must have a vertical assigned (vertical_id)
        // We also use yi_vertical string for legacy reasons/display if needed, but vertical_id is key.
        if (!profile.vertical_id) {
            return {
                error: "Access Restricted: Only members assigned to a Vertical can host events.",
                fields: { eventTitle, start_time, end_time, description, contactNumber },
            };
        }

        const currentVertical = profile.yi_vertical || "Unknown Vertical";

        // Query profiles to get all members of this vertical
        // Using vertical_id for more accurate team snapshot
        const { data: verticalMembers, error: membersError } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("vertical_id", profile.vertical_id);

        if (membersError) {
            console.error("Error fetching vertical members:", membersError);
        }

        const memberNames = verticalMembers?.map((p) => p.full_name).filter(Boolean) || [];

        // 4. Insert Data
        // Casting to any to avoid TS errors if types aren't updated yet
        const payload: any = {
            user_id: user.id,
            host_vertical: currentVertical, // Store the name for easy display
            vertical_id: profile.vertical_id, // Store key for relationships
            proposed_title: eventTitle,
            description: description,
            contact_number: contactNumber,
            category: category,
            start_time: start_time,
            end_time: end_time,
            location_name: locationName,
            image_url: coverPhotoUrl,
            gallery_urls: galleryUrls,
            vertical_members: memberNames,
            status: "pending", // Use strict ENUM literal
        };

        const { error: insertError } = await supabase.from("host_requests").insert(payload);

        if (insertError) {
            console.error("Insert Error:", insertError);
            return {
                error: "Failed to submit proposal. Please try again later.",
                fields: { eventTitle, start_time, end_time, description, contactNumber },
            };
        }

        revalidatePath("/dashboard");

        return {
            success: "Event request submitted! Once approved by an admin, it will appear on the Events page."
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

        // 3. Transformation logic
        // Use request.start_time directly as it is already an ISO string or datetime
        const finalStartTime = request.start_time;
        const finalEndTime = request.end_time;

        // 4. Insert into Events
        const { error: insertError } = await supabase.from("events").insert({
            title: request.proposed_title || "Untitled Event",
            description: request.description || "",
            start_time: finalStartTime,
            end_time: finalEndTime,
            location_name: request.location_name || "TBD",
            image_url: request.image_url || "https://placehold.co/1200x500/18181b/ffffff?text=New+Event",
            category: request.category || request.host_vertical, // Use the selected category
            is_featured: false,
            created_by: request.user_id,
            host_vertical: request.host_vertical,
            vertical_id: request.vertical_id,
            vertical_members: request.vertical_members
        });

        if (insertError) {
            console.error("Event Creation Error:", insertError);
            return { error: "Failed to create event from request." };
        }

        // 5. Update Request Status
        const { error: updateError } = await supabase
            .from("host_requests")
            .update({ status: "approved" }) // Use strict ENUM literal
            .eq("id", requestId);

        if (updateError) {
            console.error("Status Update Error:", updateError);
            return { error: "Event created, but failed to update request status." };
        }

        revalidatePath("/dashboard");
        revalidatePath(`/events`);
        return { success: "Event approved and published successfully!" };

    } catch (err) {
        console.error("Approval Error:", err);
        return { error: "An unexpected error occurred." };
    }
}
