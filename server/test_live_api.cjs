async function triggerLiveAPI() {
    const leadId = "6a61f6a2f8b7d5e04ecbddec"; // PCCOE Suvarna Patil
    try {
        const res = await fetch(`https://classgrid.in/api/request-demo/${leadId}/meeting-booked`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `demo_session=${leadId}`
            },
            body: JSON.stringify({
                scheduledAt: "2026-08-16T13:30:00.000Z", // Aug 16 at 7 PM IST
                platform: "google_meet"
            })
        });

        const data = await res.json();
        console.log("Live API Response:", data);
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

triggerLiveAPI();
