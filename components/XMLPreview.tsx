import React from 'react';

interface XMLPreviewProps {
  content: string;
}

const XMLPreview: React.FC<XMLPreviewProps> = ({ content }) => {
  const highlightXML = (xml: string) => {
    return xml
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Tags (e.g., <page)
      .replace(/&lt;(\/?[\w:-]+)/g, '<span class="text-blue-400">&lt;$1</span>')
      // Close markers (e.g., >)
      .replace(/&gt;/g, '<span class="text-blue-400">&gt;</span>')
      // Attributes (handling both quoted and unquoted like page=123)
      .replace(/(\s)([\w:-]+)=(['"]?)([^\s>]+)\3/g, '$1<span class="text-cyan-400">$2</span>=<span class="text-amber-300">$4</span>')
      // Text content inside tags
      .replace(/&gt;([^&lt;]+)&lt;/g, '&gt;<span class="text-slate-100">$1</span>&lt;');
  };

  return (
    <div className="flex-1 p-6 overflow-auto bg-[#0a0a0f]">
      <pre 
        className="code-font text-[13px] leading-relaxed text-slate-300"
        dangerouslySetInnerHTML={{ __html: highlightXML(content) }}
      />
    </div>
  );
};

export default XMLPreview;
