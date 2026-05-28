import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Hub() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const user = localStorage.getItem("wbe_user");
    if (!user) {
      navigate("/signup?mode=signin");
      return;
    }

    const quizDone = localStorage.getItem("wbe_quiz_completed");
    if (!quizDone) {
      navigate("/quiz");
      return;
    }

    const foundationStr = localStorage.getItem("empireFoundationData");
    let foundationDone = false;
    try {
      foundationDone = foundationStr
        ? JSON.parse(foundationStr)?.completed === true
        : false;
    } catch {
      foundationDone = false;
    }

    if (!foundationDone) {
      navigate("/foundation");
      return;
    }

    navigate("/premium");
  }, []);

  return <div style={{ padding: 40, color: "white" }}>Loading...</div>;
}
