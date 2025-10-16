import React, { useEffect, useState } from 'react'
import DetailsTicket from '../../../components/DetailsTicket';


function TicketDetails() {
    const [ticketId, setTicketId] = useState("");

    useEffect(() => {
        const pathname = window.location.pathname;
        const id = pathname.split("/").pop();
        setTicketId(id);
    }, []);
    return (
        <div>
            <DetailsTicket ticketId={ticketId}/>
        </div>
    )
}

export default TicketDetails