import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Welcome from "@/pages/welcome";
import Intro from "@/pages/intro";
import Signup from "@/pages/signup";
import Quiz from "@/pages/quiz";
import Analyzing from "@/pages/analyzing";
import Reveal from "@/pages/reveal";
import Report from "@/pages/report";
import Compatibility from "@/pages/compatibility";
import Premium from "@/pages/premium";
import Foundation from "@/pages/foundation";
import Hub from "@/pages/hub";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/intro" component={Intro} />
      <Route path="/signup" component={Signup} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/analyzing" component={Analyzing} />
      <Route path="/reveal" component={Reveal} />
      <Route path="/report" component={Report} />
      <Route path="/compatibility" component={Compatibility} />
      <Route path="/premium" component={Premium} />
      <Route path="/foundation" component={Foundation} />
      <Route path="/hub" component={Hub} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
