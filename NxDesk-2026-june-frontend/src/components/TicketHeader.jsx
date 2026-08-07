import { ChevronsUp, Search } from "lucide-react";

export default function TicketHeader({ ticketData, formatImpact }) {
    return (
        <div className="mb-6 flex items-center justify-between">
            <div className="w-full">
                <h1 className="text-[39px] font-semibold">DETAILS</h1>
                <div className="flex justify-between w-full items-center">
                    <div className="flex items-center gap-6">
                        <h1 className="text-[24px] font-normal">{ticketData?.summary}</h1>
                        <p className="flex text-xl items-center text-[#F24E1E] font-bold">
                            <ChevronsUp className="h-8 w-8" /> {formatImpact(ticketData?.impact)}
                        </p>
                    </div>
                    <div className="relative bg-[#FFCC7B] rounded-full p-2 px-6">
                        <h1 className="font-bold">{ticketData?.status}</h1>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search"
                            className="pl-10 pr-4 py-3 rounded-full border w-[192px] border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                </div>
                <div className="flex mt-2">
                    <ul className="flex gap-8 text-gray-500 text-sm">
                        <li>Home</li>
                        <li>List of Incident</li>
                        <li>Details</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
