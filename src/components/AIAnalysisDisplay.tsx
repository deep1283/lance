"use client";

import React from "react";

interface AIAnalysisDisplayProps {
  analysis: string;
  isLoading?: boolean;
}

const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({
  analysis,
  isLoading = false,
}) => {
  // Function to format the analysis text with emojis and styling
  const formatAnalysis = (text: string) => {
    if (!text) return text;

    // Replace common patterns with emojis and better formatting
    let formatted = text
      // Headers with emojis (remove ** from headers)
      .replace(/### (.*?):/g, "🎯 $1:")
      .replace(/## (.*?):/g, "📊 $1:")
      .replace(/# (.*?):/g, "🧠 $1:")

      // Strategy sections (remove ** from headers)
      .replace(/\*\*1\. Campaign Strategy/g, "🚀 1. Campaign Strategy")
      .replace(/\*\*2\. Creative Elements/g, "🎨 2. Creative Elements")
      .replace(/\*\*3\. Targeting Strategy/g, "🎯 3. Targeting Strategy")
      .replace(/\*\*4\. Performance Insights/g, "📈 4. Performance Insights")
      .replace(/\*\*5\. Recommendations/g, "💡 5. Recommendations")

      // Content analysis sections (remove ** from headers)
      .replace(/\*\*Content Strategy:/g, "📝 Content Strategy:")
      .replace(/\*\*Engagement Analysis:/g, "❤️ Engagement Analysis:")
      .replace(/\*\*Posting Patterns:/g, "⏰ Posting Patterns:")
      .replace(/\*\*Viral Content Insights:/g, "🔥 Viral Content Insights:")
      .replace(/\*\*Growth Opportunities:/g, "📈 Growth Opportunities:")

      // Competitive intelligence sections (remove ** from headers)
      .replace(/\*\*Market Overview:/g, "🌍 Market Overview:")
      .replace(/\*\*Competitive Positioning:/g, "⚔️ Competitive Positioning:")
      .replace(/\*\*Key Insights:/g, "🔍 Key Insights:")
      .replace(
        /\*\*Strategic Recommendations:/g,
        "🎯 Strategic Recommendations:"
      )

      // Bonus sections (remove ** from headers)
      .replace(/Bonus:/g, "🎁 Bonus:")
      .replace(/Future Upsells/g, "💰 Future Upsells")
      .replace(/Add Website/g, "🌐 Add Website")
      .replace(/Ad Budget analysis/g, "💸 Ad Budget Analysis")

      // Bullet points - clean format
      .replace(/^- /gm, "• ")
      .replace(/^\* /gm, "• ")

      // Currency formatting
      .replace(/₹(\d+)/g, "💰 ₹$1")
      .replace(/\$(\d+)/g, "💵 $$1")
      .replace(/(\d+)%/g, "📊 $1%");

    return formatted;
  };

  // Function to render markdown-like content (Document style)
  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let key = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        elements.push(<br key={key++} />);
        return;
      }

      // Main headers (H1 style) - Large and bold like the document
      if (
        trimmedLine.startsWith("🎯 ") ||
        trimmedLine.startsWith("📊 ") ||
        trimmedLine.startsWith("🧠 ")
      ) {
        elements.push(
          <h2
            key={key++}
            className="text-white font-bold mt-8 mb-6 text-2xl leading-tight"
          >
            {trimmedLine}
          </h2>
        );
      }
      // Framework badge - Green checkmark style
      else if (
        trimmedLine.includes("Step-by-Step") ||
        trimmedLine.includes("Framework")
      ) {
        elements.push(
          <div
            key={key++}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2 mb-4 inline-block"
          >
            <span className="text-green-700 dark:text-green-400 font-bold text-sm">
              ✅ {trimmedLine}
            </span>
          </div>
        );
      }
      // Numbered sections - Bold like the document
      else if (
        trimmedLine.match(/^\d+\./) ||
        trimmedLine.startsWith("🚀 ") ||
        trimmedLine.startsWith("🎨 ") ||
        trimmedLine.startsWith("📈 ") ||
        trimmedLine.startsWith("💡 ") ||
        trimmedLine.startsWith("📝 ") ||
        trimmedLine.startsWith("❤️ ") ||
        trimmedLine.startsWith("⏰ ") ||
        trimmedLine.startsWith("🔥 ") ||
        trimmedLine.startsWith("🌍 ") ||
        trimmedLine.startsWith("⚔️ ") ||
        trimmedLine.startsWith("🔍 ") ||
        trimmedLine.startsWith("🎁 ") ||
        trimmedLine.startsWith("💰 ") ||
        trimmedLine.startsWith("🌐 ") ||
        trimmedLine.startsWith("💸 ")
      ) {
        elements.push(
          <h3
            key={key++}
            className="text-white font-bold mt-6 mb-3 text-lg leading-snug"
          >
            {trimmedLine}
          </h3>
        );
      }
      // Bullet points - Clean document style
      else if (trimmedLine.startsWith("• ")) {
        elements.push(
          <div
            key={key++}
            className="ml-6 text-white text-base mb-2 flex items-start"
          >
            <span className="text-gray-500 dark:text-gray-400 mr-2 mt-1">
              •
            </span>
            <span className="flex-1 leading-relaxed">
              {trimmedLine.substring(2)}
            </span>
          </div>
        );
      }
      // Regular paragraphs - Document style
      else {
        elements.push(
          <p key={key++} className="text-white text-base mb-4 leading-relaxed">
            {trimmedLine}
          </p>
        );
      }
    });

    return elements;
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-500"></div>
        <p className="text-gray-300 text-sm">🧠 Generating AI analysis...</p>
      </div>
    );
  }

  const formattedAnalysis = formatAnalysis(analysis);

  return (
    <div className="ai-analysis-content">
      {renderFormattedText(formattedAnalysis)}
    </div>
  );
};

export default AIAnalysisDisplay;
