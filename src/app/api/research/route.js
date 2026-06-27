import { NextResponse } from "next/server";
import { compiledGraph } from "@/src/lib/agent.js";

export async function POST(req) {
  try {
    const { companyName } = await req.json();

    if (!companyName || typeof companyName !== "string" || companyName.trim() === "") {
      return NextResponse.json(
        { error: "Company name is required and must be a valid string." },
        { status: 400 }
      );
    }

    // Check if at least one API key is set
    if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: "API Key Missing",
          message: "Please configure either OPENAI_API_KEY or GEMINI_API_KEY in your .env file to enable the AI engine."
        },
        { status: 500 }
      );
    }

    console.log(`Starting investment research for: "${companyName}"`);

    // Run the compiled LangGraph workflow
    const initialState = {
      companyQuery: companyName,
    };

    const finalState = await compiledGraph.invoke(initialState);

    // Structure the response format requested in the prompt
    return NextResponse.json({
      success: true,
      ticker: finalState.tickerInfo?.symbol || "N/A",
      companyName: finalState.tickerInfo?.name || companyName,
      decision: finalState.investmentVerdict || "PASS",
      reasoning: finalState.investmentReasoning?.points || [],
      risks: finalState.investmentReasoning?.risks || [],
      sentiment: {
        score: finalState.sentimentScore ?? 50,
        summary: finalState.sentimentSummary || "N/A",
      },
      researchData: finalState.financialData || {},
      steps: finalState.steps || [],
    });

  } catch (error) {
    console.error("Error in investment research API route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: error.message || "An unexpected error occurred during execution.",
      },
      { status: 500 }
    );
  }
}
