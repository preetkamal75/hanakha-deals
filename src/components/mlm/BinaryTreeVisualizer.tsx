import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Award, Eye, Plus, Minus } from 'lucide-react';
import { BinaryTreeManager, TreeNode } from '../../utils/binaryTreeUtils';

interface BinaryTreeVisualizerProps {
  userId: string;
  treeData: TreeNode[];
  onNodeClick?: (node: TreeNode) => void;
  showStats?: boolean;
}

const BinaryTreeVisualizer: React.FC<BinaryTreeVisualizerProps> = ({
  userId,
  treeData,
  onNodeClick,
  showStats = true
}) => {
  const [treeManager] = useState(() => new BinaryTreeManager(treeData));
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [expandedLevels, setExpandedLevels] = useState(3);

  useEffect(() => {
    treeManager.loadTree(treeData);
  }, [treeData, treeManager]);

  const userNode = treeManager.getUserPosition(userId);
  const stats = treeManager.getTreeStats(userId);
  const directChildren = treeManager.getDirectChildren(userId);

  const handleNodeClick = (node: TreeNode) => {
    setSelectedNode(node);
    onNodeClick?.(node);
  };

  const renderNode = (node: TreeNode | null, position: 'left' | 'right' | 'root', level: number) => {
    if (!node || level > expandedLevels) {
      return (
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
            <Plus className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Available</p>
        </div>
      );
    }

    const isSelected = selectedNode?.id === node.id;
    const isCurrentUser = node.userId === userId;
    const nodeChildren = treeManager.getDirectChildren(node.userId);

    return (
      <div className="flex flex-col items-center">
        {/* Node */}
        <div
          onClick={() => handleNodeClick(node)}
          className={`relative w-24 h-24 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
            isCurrentUser
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
              : isSelected
              ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg'
              : 'bg-white border-2 border-gray-200 hover:border-indigo-300 hover:shadow-md'
          }`}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
              isCurrentUser || isSelected ? 'bg-white/20' : 'bg-gray-100'
            }`}>
              <Users className={`h-4 w-4 ${
                isCurrentUser || isSelected ? 'text-white' : 'text-gray-600'
              }`} />
            </div>
            <p className={`text-xs font-medium text-center leading-tight ${
              isCurrentUser || isSelected ? 'text-white' : 'text-gray-900'
            }`}>
              {node.userData?.firstName || 'User'}
            </p>
            <p className={`text-xs text-center ${
              isCurrentUser || isSelected ? 'text-white/80' : 'text-gray-500'
            }`}>
              L{node.level}
            </p>
          </div>
          
          {/* Position indicator */}
          <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            position === 'left' ? 'bg-blue-500 text-white' :
            position === 'right' ? 'bg-green-500 text-white' :
            'bg-purple-500 text-white'
          }`}>
            {position === 'left' ? 'L' : position === 'right' ? 'R' : 'R'}
          </div>
        </div>

        {/* Node info */}
        <div className="mt-2 text-center">
          <p className="text-xs font-medium text-gray-900">
            {node.sponsorshipNumber}
          </p>
          <p className="text-xs text-gray-500">
            {node.userData?.email || 'No email'}
          </p>
        </div>

        {/* Children */}
        {level < expandedLevels && (nodeChildren.left || nodeChildren.right) && (
          <div className="mt-6 flex space-x-8">
            <div className="flex flex-col items-center">
              <div className="w-px h-6 bg-gray-300 mb-2"></div>
              {renderNode(nodeChildren.left, 'left', level + 1)}
            </div>
            <div className="flex flex-col items-center">
              <div className="w-px h-6 bg-gray-300 mb-2"></div>
              {renderNode(nodeChildren.right, 'right', level + 1)}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!userNode) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Tree Data</h3>
        <p className="text-gray-600">User not found in the MLM tree.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Binary Tree Structure</h3>
            <p className="text-gray-600">Your MLM network hierarchy</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Zoom controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-gray-700">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Level controls */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Levels:</label>
              <select
                value={expandedLevels}
                onChange={(e) => setExpandedLevels(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats.totalDownline}</div>
              <div className="text-sm text-gray-600">Total Network</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.leftSideCount}</div>
              <div className="text-sm text-gray-600">Left Side</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.rightSideCount}</div>
              <div className="text-sm text-gray-600">Right Side</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.directReferrals}</div>
              <div className="text-sm text-gray-600">Direct Referrals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.maxDepth}</div>
              <div className="text-sm text-gray-600">Max Depth</div>
            </div>
          </div>
        </div>
      )}

      {/* Tree Visualization */}
      <div className="p-8 overflow-auto">
        <div 
          className="flex justify-center"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
        >
          {renderNode(userNode, 'root', 0)}
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="p-6 bg-indigo-50 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-indigo-900 mb-4">Node Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-indigo-700">Name</label>
              <p className="text-gray-900">
                {selectedNode.userData?.firstName} {selectedNode.userData?.lastName}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-indigo-700">Sponsorship Number</label>
              <p className="text-gray-900 font-mono">{selectedNode.sponsorshipNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-indigo-700">Level</label>
              <p className="text-gray-900">{selectedNode.level}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-indigo-700">Position</label>
              <p className="text-gray-900 capitalize">{selectedNode.position}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-indigo-700">Status</label>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                selectedNode.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {selectedNode.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-indigo-700">Email</label>
              <p className="text-gray-900">{selectedNode.userData?.email || 'Not provided'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BinaryTreeVisualizer;