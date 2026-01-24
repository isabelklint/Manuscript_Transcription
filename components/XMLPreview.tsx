
import React from 'react';

interface XMLPreviewProps {
  content: string;
}

const XMLPreview: React.FC<XMLPreviewProps> = ({ content }) => {
  // Enhanced syntax highlighting
  const highlightXML = (xml: string) => {
    return xml
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Tags
      .replace(/&lt;(\/?[\w:-]+)/g, '<span class="text-blue-400">&lt;$1</span>')
      .replace(/&gt;/g, '<span class="text-blue-400">&gt;</span>')
      // Attributes
      .replace(/(\s)([\w:-]+)=(['"])(.*?)\3/g, '$1<span class="text-cyan-400">$2</span>=<span class="text-amber-300">"$4"</span>')
      // Values inside simple tags
      .replace(/&gt;([^&lt;]+)&lt;/g, '&gt;<span class="text-slate-100">$1</span>&lt;');
  };

  return (
    <div className="flex-1 p-4 overflow-auto scrollbar-hide">
      <pre 
        className="code-font text-sm leading-relaxed text-slate-300"
        dangerouslySetInnerHTML={{ __html: highlightXML(content) }}
      />
    </div>
  );
};

export default XMLPreview;
