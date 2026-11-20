import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Router as WouterRouter, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Nutrition from "./pages/Nutrition";
import Plants from "./pages/Plants";
import Catalogue from "./pages/Catalogue";
import Artisans from "./pages/Artisans";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <WouterRouter base={import.meta.env.BASE_URL}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/nutrition/:slug"} component={Nutrition} />
        <Route path={"/nutrition"} component={Nutrition} />
        <Route path={"/catalogue/:slug"} component={Catalogue} />
        <Route path={"/catalogue"} component={Catalogue} />
        <Route path={"/artisans/:slug"} component={Artisans} />
        <Route path={"/artisans"} component={Artisans} />
        <Route path={"/plants/:slug"} component={Plants} />
        <Route path={"/plants"} component={Plants} />
        <Route path={"/admin"} component={Admin} />
        <Route path={"/admin/:section"} component={Admin} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
