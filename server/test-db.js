
require("dotenv").config();

const supabase = require("./config/supabase");

async function testDatabase() {
  console.log("Checking CrowdFlow Supabase connection...");

  // Check whether buses can be read
  const { data: buses, error: busError } = await supabase
    .from("buses")
    .select("id")
    .limit(1);

  if (busError) {
    console.error("Bus table error:", busError.message);
    return;
  }

  console.log("Bus table access: SUCCESS");

  // Check whether deployment recommendations can be read
  const { data: recommendations, error: recommendationError } =
    await supabase
      .from("deployment_recommendations")
      .select("id, route_name, status")
      .limit(5);

  if (recommendationError) {
    console.error(
      "Recommendation table error:",
      recommendationError.message
    );
    return;
  }

  console.log("Recommendation table access: SUCCESS");
  console.log("Existing records:", recommendations.length);
  console.log("Supabase connection test completed.");
}

testDatabase();
