import React, { createContext, useContext, useState } from 'react';

interface MLMNode {
  id: string;
  userId: string;
  parentId: string | null;
  leftChild: string | null;
  rightChild: string | null;
  level: number;
  sponsorshipNumber: string;
}

interface MLMContextType {
  tree: MLMNode[];
  addUserToTree: (userId: string, parentId: string | null, sponsorshipNumber: string) => string;
  getUserPosition: (userId: string) => MLMNode | null;
  getDownline: (userId: string) => MLMNode[];
  getUpline: (userId: string) => MLMNode[];
}

const MLMContext = createContext<MLMContextType | undefined>(undefined);

export const useMLM = () => {
  const context = useContext(MLMContext);
  if (!context) {
    throw new Error('useMLM must be used within an MLMProvider');
  }
  return context;
};

export const MLMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tree, setTree] = useState<MLMNode[]>([]);

  const findAvailablePosition = (parentId: string): 'left' | 'right' | null => {
    const parent = tree.find(node => node.id === parentId);
    if (!parent) return null;
    
    if (!parent.leftChild) return 'left';
    if (!parent.rightChild) return 'right';
    
    // If parent is full, find the first available position in the subtree
    const leftSubtree = getDownline(parent.leftChild);
    const rightSubtree = getDownline(parent.rightChild);
    
    // Prefer left subtree (left-first assignment)
    for (const node of leftSubtree) {
      if (!node.leftChild || !node.rightChild) {
        return findAvailablePosition(node.id);
      }
    }
    
    for (const node of rightSubtree) {
      if (!node.leftChild || !node.rightChild) {
        return findAvailablePosition(node.id);
      }
    }
    
    return null;
  };

  const addUserToTree = (userId: string, parentId: string | null, sponsorshipNumber: string): string => {
    const nodeId = Math.random().toString(36);
    
    if (!parentId) {
      // Root node
      const newNode: MLMNode = {
        id: nodeId,
        userId,
        parentId: null,
        leftChild: null,
        rightChild: null,
        level: 0,
        sponsorshipNumber
      };
      setTree([newNode]);
      return nodeId;
    }
    
    // Find available position using binary assignment
    let actualParentId = parentId;
    let position: 'left' | 'right' | null = null;
    
    // Find the first available position starting from the given parent
    const findFirstAvailable = (startParentId: string): { parentId: string, position: 'left' | 'right' } | null => {
      const queue = [startParentId];
      
      while (queue.length > 0) {
        const currentParentId = queue.shift()!;
        const parent = tree.find(node => node.id === currentParentId);
        
        if (parent) {
          if (!parent.leftChild) {
            return { parentId: currentParentId, position: 'left' };
          }
          if (!parent.rightChild) {
            return { parentId: currentParentId, position: 'right' };
          }
          
          // Add children to queue for BFS
          if (parent.leftChild) queue.push(parent.leftChild);
          if (parent.rightChild) queue.push(parent.rightChild);
        }
      }
      
      return null;
    };
    
    const available = findFirstAvailable(parentId);
    if (available) {
      actualParentId = available.parentId;
      position = available.position;
    } else {
      throw new Error('No available position found in the tree');
    }
    
    const parent = tree.find(node => node.id === actualParentId);
    if (!parent) {
      throw new Error('Parent node not found');
    }
    
    const newNode: MLMNode = {
      id: nodeId,
      userId,
      parentId: actualParentId,
      leftChild: null,
      rightChild: null,
      level: parent.level + 1,
      sponsorshipNumber
    };
    
    setTree(prevTree => {
      const updatedTree = [...prevTree];
      const parentIndex = updatedTree.findIndex(node => node.id === actualParentId);
      
      if (position === 'left') {
        updatedTree[parentIndex].leftChild = nodeId;
      } else {
        updatedTree[parentIndex].rightChild = nodeId;
      }
      
      updatedTree.push(newNode);
      return updatedTree;
    });
    
    return nodeId;
  };

  const getUserPosition = (userId: string): MLMNode | null => {
    return tree.find(node => node.userId === userId) || null;
  };

  const getDownline = (nodeId: string): MLMNode[] => {
    const result: MLMNode[] = [];
    const queue = [nodeId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const node = tree.find(n => n.id === currentId);
      
      if (node) {
        result.push(node);
        if (node.leftChild) queue.push(node.leftChild);
        if (node.rightChild) queue.push(node.rightChild);
      }
    }
    
    return result.slice(1); // Remove the root node itself
  };

  const getUpline = (nodeId: string): MLMNode[] => {
    const result: MLMNode[] = [];
    let currentNode = tree.find(n => n.id === nodeId);
    
    while (currentNode && currentNode.parentId) {
      const parent = tree.find(n => n.id === currentNode.parentId);
      if (parent) {
        result.push(parent);
        currentNode = parent;
      } else {
        break;
      }
    }
    
    return result;
  };

  const value = {
    tree,
    addUserToTree,
    getUserPosition,
    getDownline,
    getUpline
  };

  return (
    <MLMContext.Provider value={value}>
      {children}
    </MLMContext.Provider>
  );
};