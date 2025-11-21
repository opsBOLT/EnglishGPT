import { BookOpen } from 'lucide-react';

interface ContentViewerProps {
  category: string;
}

const ContentViewer = ({ category }: ContentViewerProps) => {
  const getContent = () => {
    switch (category) {
      case 'paper1':
        return {
          title: 'Paper 1: Guided Literary Analysis',
          sections: [
            {
              heading: 'Understanding the Format',
              content:
                'Paper 1 consists of two passages (one prose and one poetry) from different literary forms. You will choose one passage and write a guided literary analysis based on the guiding questions provided.',
            },
            {
              heading: 'Key Skills Required',
              content:
                'Analysis of literary techniques, understanding of context, close reading abilities, and structured essay writing with clear argumentation and evidence.',
            },
            {
              heading: 'Time Management',
              content:
                'You have 2 hours and 15 minutes. Spend 15 minutes reading both passages, 15 minutes planning, 1 hour 30 minutes writing, and 15 minutes reviewing.',
            },
          ],
        };
      case 'paper2':
        return {
          title: 'Paper 2: Comparative Essay',
          sections: [
            {
              heading: 'Essay Structure',
              content:
                'Your comparative essay should have a clear introduction with a thesis, body paragraphs that compare and contrast your chosen works, and a strong conclusion.',
            },
            {
              heading: 'Choosing Your Works',
              content:
                'Select works that have clear points of comparison. Consider themes, literary techniques, authorial choices, and cultural contexts.',
            },
            {
              heading: 'Writing Comparative Analysis',
              content:
                'Use comparative language, ensure balanced treatment of both works, and integrate your comparisons throughout rather than discussing each work separately.',
            },
          ],
        };
      default:
        return {
          title: 'Study Content',
          sections: [
            {
              heading: 'Welcome',
              content: 'This section contains comprehensive study materials to help you prepare for your English exam.',
            },
          ],
        };
    }
  };

  const content = getContent();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{content.title}</h1>
        <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
      </div>

      <div className="space-y-8">
        {content.sections.map((section, index) => (
          <div key={index} className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{index + 1}</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{section.heading}</h2>
            </div>
            <p className="text-gray-700 leading-relaxed ml-11">{section.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <BookOpen className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Note</h3>
            <p className="text-sm text-gray-700">
              This is placeholder content. In a production environment, this would display actual study materials, videos, PDFs, and interactive content tailored to each category.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentViewer;
