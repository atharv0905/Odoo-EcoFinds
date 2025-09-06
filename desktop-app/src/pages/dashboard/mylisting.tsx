import LayoutDashboard from "@/components/dashboard/layout";
import { ListingsSection } from "@/components/dashboard/mylisting";

const MyListing = () => {
    return (
        <LayoutDashboard>
            <div>
                <ListingsSection />
            </div>
        </LayoutDashboard>  
    )
}

export default MyListing;