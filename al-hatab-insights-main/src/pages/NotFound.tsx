import { Layout } from "@/components/layout/Layout";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl sm:text-8xl font-bold text-primary/20 mb-3 sm:mb-4">404</div>
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Button variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Link to="/" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              Command Center
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
