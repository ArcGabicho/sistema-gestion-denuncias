import Navbar from './components/Navbar';
import HeroSection from "./components/HeroSection";
import FeatureSection from "./components/FeatureSection";
import Workflow from "./components/Workflow";
import Footer from "./components/Footer";
import Testimonials from "./components/Testimonials";
import FAQs from "./components/FAQs";

const Page = () => {
    return (
        <main>
            <Navbar />
            <div className="max-w-7xl mx-auto pt-20 px-6">
                <HeroSection />
                <FeatureSection />
                <Workflow />
                <Testimonials />
                <FAQs />
                <Footer />
            </div>
        </main>
    )   
}

export default Page;