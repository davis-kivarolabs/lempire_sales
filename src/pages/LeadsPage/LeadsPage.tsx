import { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
    collection,
    getDocs,
    query,
    orderBy,
} from "firebase/firestore";

import "./LeadsPage.css";

interface Lead {
    id: string;
    scope: string;
    location: string;
    name: string;
    phone: string;
    start_time: string;
    created_at?: any;
}

const LeadsPage = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeads = async () => {
        try {
            const q = query(
                collection(db, "parppidam_expo_leads"),
                orderBy("created_at", "desc")
            );

            const snap = await getDocs(q);

            const data: Lead[] = snap.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<Lead, "id">),
            }));

            setLeads(data);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    if (loading) return <div className="lead_loading">Loading Leads...</div>;

    if (!leads.length)
        return <div className="lead_empty">No Leads Collected Yet</div>;

    return (
        <div className="leads_page">
            <h2 className="title">Expo Leads</h2>

            <div className="table_wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Service</th>
                            <th>Location</th>
                            <th>Start Time</th>
                            <th>Date</th>
                        </tr>
                    </thead>

                    <tbody>
                        {leads.map((lead) => (
                            <tr key={lead.id}>
                                <td>{lead.name}</td>
                                <td>{lead.phone}</td>
                                <td>{lead.scope}</td>
                                <td>{lead.location}</td>
                                <td>{lead.start_time}</td>
                                <td>
                                    {lead.created_at?.seconds
                                        ? new Date(
                                            lead.created_at.seconds * 1000
                                        ).toLocaleString()
                                        : "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeadsPage;