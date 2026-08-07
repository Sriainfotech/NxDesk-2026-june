import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTickets } from '../../store/ticketSlice';

const TicketList = () => {
  const dispatch = useDispatch();
  const tickets = useSelector((state) => state.tickets.tickets);
  const status = useSelector((state) => state.tickets.status);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchTickets());
    }
  }, [dispatch, status]);

  return (
    <div className={`max-h-[400px] ${tickets.length > 10 ? 'overflow-y-scroll' : ''} bg-white rounded-lg shadow`}>
      {tickets.map((ticket) => (
        <div key={ticket.id} className="border-b last:border-0 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-gray-700 font-bold">{ticket.title}</h3>
              <p className="text-gray-500 text-sm">{ticket.date}</p>
            </div>
            <div className={`ml-auto ${getStatusColor(ticket.status)} text-sm px-2 py-1 rounded`}>
              {ticket.status}
            </div>
            <div className="ml-4 text-sm text-gray-600">{`SLA: ${ticket.sla}`}</div>
          </div>
          <div className="text-gray-500 text-sm mt-2">{`Resolved in ${ticket.resolvedIn} (Time for Resolution: ${ticket.resolutionTime})`}</div>
        </div>
      ))}
    </div>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Resolved':
      return 'bg-green-100 text-green-800';
    case 'Work in Progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'Open':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default TicketList;
