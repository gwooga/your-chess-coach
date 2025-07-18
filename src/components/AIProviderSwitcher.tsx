import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { setAIProvider, getCurrentProvider, AIProvider } from '@/utils/aiConfig';

const AIProviderSwitcher: React.FC = () => {
  const [currentProvider, setCurrentProvider] = React.useState<AIProvider>(getCurrentProvider());

  const handleSwitchProvider = (provider: AIProvider) => {
    setAIProvider(provider);
    setCurrentProvider(provider);
  };

  return (
    <Card className="w-full max-w-md mx-auto mb-6">
      <CardHeader>
        <CardTitle className="text-lg">AI Provider</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            variant={currentProvider === 'openai' ? 'default' : 'outline'}
            onClick={() => handleSwitchProvider('openai')}
            className="flex-1"
          >
            OpenAI
          </Button>
          <Button
            variant={currentProvider === 'deepseek' ? 'default' : 'outline'}
            onClick={() => handleSwitchProvider('deepseek')}
            className="flex-1"
          >
            DeepSeek
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Current: {currentProvider === 'openai' ? 'OpenAI (GPT-4o)' : 'DeepSeek (DeepSeek Chat)'}
        </p>
      </CardContent>
    </Card>
  );
};

export default AIProviderSwitcher; 