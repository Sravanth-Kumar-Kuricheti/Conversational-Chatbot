import React from 'react';
import { Lightbulb, ExternalLink, ArrowRight, CheckCircle2, Wrench, Sparkles } from 'lucide-react';

export default function RecommendationSection({ metadata, onSelectQuestion }) {
  if (!metadata) return null;

  const { recommendation, resources, suggested_questions } = metadata;

  const hasRec = recommendation && (recommendation.summary || (recommendation.next_steps && recommendation.next_steps.length > 0));
  const hasResources = resources && resources.length > 0;
  const hasQuestions = suggested_questions && suggested_questions.length > 0;

  if (!hasRec && !hasResources && !hasQuestions) return null;

  return (
    <div className="mt-6 pt-5 border-t border-[#333333] space-y-5 animate-in fade-in duration-200">
      {/* 1. "My recommendation" Section */}
      {hasRec && (
        <div className="bg-[#262626] border border-[#3A3A3A] rounded-card p-4 space-y-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#10A37F]/20 text-[#10A37F] flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h4 className="text-[14.5px] font-semibold text-white tracking-tight">
              My recommendation
            </h4>
          </div>

          {/* Personalized Recommendation Summary */}
          {recommendation.summary && (
            <p className="text-[13.5px] text-[#D1D1D1] leading-relaxed">
              {recommendation.summary}
            </p>
          )}

          {/* Practical Next Steps */}
          {recommendation.next_steps && recommendation.next_steps.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[12px] font-semibold text-[#8E8EA0] uppercase tracking-wider">
                Practical Next Steps
              </span>
              <ul className="space-y-1.5">
                {recommendation.next_steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[13px] text-[#ECECEC]">
                    <CheckCircle2 className="w-4 h-4 text-[#10A37F] shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Useful Tools or Technologies */}
          {recommendation.tools && recommendation.tools.length > 0 && (
            <div className="pt-2 border-t border-[#333333] flex flex-wrap items-center gap-2">
              <span className="text-[11.5px] font-semibold text-[#8E8EA0] flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                Tools:
              </span>
              {recommendation.tools.map((tool, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-[#303030] border border-[#404040] text-[12px] text-[#E4E4E7] font-medium"
                >
                  <strong className="text-white">{tool.name}</strong>
                  {tool.category && <span className="text-[#8E8EA0] ml-1.5">({tool.category})</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. "This might also interest you" Section (Verified Resource Cards) */}
      {hasResources && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <h4 className="text-[13.5px] font-semibold text-white tracking-tight">
              This might also interest you
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resources.map((res, idx) => (
              <a
                key={idx}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between p-3.5 rounded-card bg-[#262626] hover:bg-[#2F2F2F] border border-[#3A3A3A] hover:border-[#525252] transition-all duration-150 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold text-[#10A37F] bg-[#10A37F]/10 px-2 py-0.5 rounded">
                      {res.source}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#8E8EA0] group-hover:text-white transition-colors" />
                  </div>
                  <h5 className="text-[13.5px] font-medium text-white group-hover:text-[#10A37F] transition-colors line-clamp-1">
                    {res.title}
                  </h5>
                  <p className="text-[12px] text-[#8E8EA0] line-clamp-2 mt-1 leading-snug">
                    {res.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11.5px] text-[#10A37F] font-medium mt-3 pt-2 border-t border-[#333333]">
                  <span>Learn More</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 3. Clickable Suggested Question Chips */}
      {hasQuestions && onSelectQuestion && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#8E8EA0]">
            <Sparkles className="w-3.5 h-3.5 text-[#10A37F]" />
            <span>Suggested follow-up questions:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggested_questions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => onSelectQuestion(q)}
                className="px-3 py-1.5 rounded-full bg-[#2A2A2A] hover:bg-[#333333] border border-[#3E3E3E] hover:border-[#525252] text-[12.5px] text-[#D1D1D1] hover:text-white transition-all text-left cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
