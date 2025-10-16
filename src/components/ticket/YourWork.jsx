import React from "react";
import Search from "../common/Search";
import TicketList from "./TicketList";

const YourWork = () => {
    return(
        <div>
            Your Ticket List
            <Search />
            Below are the List of Tickets
            <TicketList />
        </div>
    )
}

export default YourWork;