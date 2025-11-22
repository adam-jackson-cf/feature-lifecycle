'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRules } from '@/lib/hooks/useRules';

export function RulesEditor() {
  const { data: rules, isLoading, update } = useRules();
  const [activeTab, setActiveTab] = useState<'complexity' | 'discipline'>('complexity');
  const [editedRules, setEditedRules] = useState<string>('');

  if (isLoading) {
    return <div>Loading rules...</div>;
  }

  if (!rules) {
    return <div>No rules found</div>;
  }

  const handleEdit = () => {
    const rulesToEdit = activeTab === 'complexity' ? rules.complexity : rules.discipline;
    setEditedRules(JSON.stringify(rulesToEdit, null, 2));
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editedRules);
      update({
        [activeTab]: parsed,
      });
    } catch (_error) {
      alert('Invalid JSON');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setActiveTab('complexity')}
          className={`px-4 py-2 ${
            activeTab === 'complexity' ? 'border-b-2 border-black dark:border-white' : ''
          }`}
        >
          Complexity Rules
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('discipline')}
          className={`px-4 py-2 ${
            activeTab === 'discipline' ? 'border-b-2 border-black dark:border-white' : ''
          }`}
        >
          Discipline Rules
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'complexity' ? 'Complexity Configuration' : 'Discipline Rules'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <textarea
              value={
                editedRules ||
                JSON.stringify(
                  activeTab === 'complexity' ? rules.complexity : rules.discipline,
                  null,
                  2
                )
              }
              onChange={(e) => setEditedRules(e.target.value)}
              className="w-full h-96 font-mono text-sm border rounded p-2"
            />
            <div className="flex gap-4">
              <Button onClick={handleEdit}>Edit</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
