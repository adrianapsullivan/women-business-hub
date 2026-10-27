import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const introSource = readFileSync(
  new URL("../pages/intro.tsx", import.meta.url),
  "utf8",
);
const instructionsSource = readFileSync(
  new URL("../pages/assessment-instructions.tsx", import.meta.url),
  "utf8",
);
const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

test("the main welcome page contains the approved content and opens instructions", () => {
  assert.match(introSource, /The DNA Experience/i);
  assert.match(
    introSource,
    /tracking-\[0\.16em\][^\"]*font-semibold[^\"]*sm:text-xs/,
  );
  assert.match(introSource, /25 Questions · About 10 Minutes/i);
  assert.match(introSource, /Reveal Your/);
  assert.match(introSource, /Entrepreneur/);
  assert.match(introSource, /DNA/);
  assert.match(
    introSource.replace(/\s+/g, " "),
    /Discover your natural strengths, how you approach opportunities, and the entrepreneurial path that may fit you best\./,
  );
  assert.match(introSource, /Discover how you naturally think\./);
  assert.match(introSource, /Recognize what comes naturally to you\./);
  assert.match(introSource, /Explore business models that may suit you\./);
  assert.match(introSource, /Understand how you approach opportunities\./);
  assert.match(introSource, /8 Possible Identities/);
  assert.match(
    introSource.replace(/\s+/g, " "),
    /Discover which of the 8 Entrepreneur DNA identities best reflects your natural strengths\./,
  );
  assert.match(introSource, /your answers stay private/i);
  assert.doesNotMatch(introSource, /Takes 5 minutes/i);
  assert.match(introSource, /navigate\("\/assessment-instructions"\)/);
});

test("the instructions page contains the approved content and starts question one", () => {
  const flatSource = instructionsSource.replace(/\s+/g, " ");

  assert.match(
    instructionsSource,
    /Before You <span[^>]*>Begin<\/span>/,
  );
  assert.match(
    instructionsSource,
    /tracking-\[0\.16em\][^\"]*font-semibold[^\"]*sm:text-xs/,
  );
  assert.match(instructionsSource, /-translate-y-12/);
  assert.match(instructionsSource, /There are no right or wrong answers\./);
  assert.match(
    flatSource,
    /Think about how you naturally approach situations, not what you think you should do or what your current circumstances require\./,
  );
  assert.match(
    flatSource,
    /If two answers feel right, choose the one that feels most like you\./,
  );
  assert.match(instructionsSource, /Trust your instincts\. Don&apos;t overthink it\./);
  assert.match(instructionsSource, /Begin Assessment/);
  assert.doesNotMatch(instructionsSource, /About 10 Minutes/i);
  assert.match(instructionsSource, /wbe_intro_complete/);
  assert.match(instructionsSource, /navigate\("\/quiz"\)/);
});

test("the instructions route is registered", () => {
  assert.match(
    appSource,
    /<Route path="\/assessment-instructions" component=\{AssessmentInstructions\} \/>/,
  );
});
