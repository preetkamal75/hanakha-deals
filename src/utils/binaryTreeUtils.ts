/**
 * Binary Tree Utilities for MLM Hierarchical System
 * Implements top-to-bottom, left-to-right placement algorithm
 */

export interface TreeNode {
  id: string;
  userId: string;
  parentId: string | null;
  leftChildId: string | null;
  rightChildId: string | null;
  level: number;
  position: 'left' | 'right' | 'root';
  sponsorshipNumber: string;
  isActive: boolean;
  userData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export interface PlacementResult {
  success: boolean;
  nodeId?: string;
  parentId?: string;
  position?: 'left' | 'right';
  level?: number;
  error?: string;
}

export class BinaryTreeManager {
  private tree: Map<string, TreeNode> = new Map();

  constructor(nodes: TreeNode[] = []) {
    this.loadTree(nodes);
  }

  /**
   * Load tree from array of nodes
   */
  loadTree(nodes: TreeNode[]): void {
    this.tree.clear();
    nodes.forEach(node => {
      this.tree.set(node.id, node);
    });
  }

  /**
   * Get all nodes as array
   */
  getTreeAsArray(): TreeNode[] {
    return Array.from(this.tree.values());
  }

  /**
   * Find the optimal placement position for a new user
   * Follows top-to-bottom, left-to-right approach
   */
  findOptimalPlacement(sponsorId: string): PlacementResult {
    const sponsor = this.findNodeBySponsorshipNumber(sponsorId);
    
    if (!sponsor) {
      return {
        success: false,
        error: 'Sponsor not found in the tree'
      };
    }

    // Use breadth-first search starting from sponsor
    const placement = this.breadthFirstSearch(sponsor.id);
    
    if (!placement) {
      return {
        success: false,
        error: 'No available position found in the tree'
      };
    }

    return {
      success: true,
      nodeId: this.generateNodeId(),
      parentId: placement.parentId,
      position: placement.position,
      level: placement.level
    };
  }

  /**
   * Breadth-first search to find the first available position
   * Prioritizes left positions over right positions at each level
   */
  private breadthFirstSearch(startNodeId: string): { parentId: string; position: 'left' | 'right'; level: number } | null {
    const queue: string[] = [startNodeId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      
      if (visited.has(currentNodeId)) {
        continue;
      }
      visited.add(currentNodeId);

      const currentNode = this.tree.get(currentNodeId);
      if (!currentNode) continue;

      // Check if current node has available positions
      if (!currentNode.leftChildId) {
        return {
          parentId: currentNodeId,
          position: 'left',
          level: currentNode.level + 1
        };
      }

      if (!currentNode.rightChildId) {
        return {
          parentId: currentNodeId,
          position: 'right',
          level: currentNode.level + 1
        };
      }

      // Add children to queue for next level search
      // Add left child first to maintain left-to-right priority
      if (currentNode.leftChildId) {
        queue.push(currentNode.leftChildId);
      }
      if (currentNode.rightChildId) {
        queue.push(currentNode.rightChildId);
      }
    }

    return null;
  }

  /**
   * Add a new user to the tree
   */
  addUser(
    userId: string,
    sponsorshipNumber: string,
    sponsorId: string,
    userData?: TreeNode['userData']
  ): PlacementResult {
    const placement = this.findOptimalPlacement(sponsorId);
    
    if (!placement.success) {
      return placement;
    }

    const newNode: TreeNode = {
      id: placement.nodeId!,
      userId,
      parentId: placement.parentId!,
      leftChildId: null,
      rightChildId: null,
      level: placement.level!,
      position: placement.position!,
      sponsorshipNumber,
      isActive: true,
      userData
    };

    // Add node to tree
    this.tree.set(newNode.id, newNode);

    // Update parent node
    const parent = this.tree.get(placement.parentId!);
    if (parent) {
      if (placement.position === 'left') {
        parent.leftChildId = newNode.id;
      } else {
        parent.rightChildId = newNode.id;
      }
      this.tree.set(parent.id, parent);
    }

    return {
      success: true,
      nodeId: newNode.id,
      parentId: placement.parentId,
      position: placement.position,
      level: placement.level
    };
  }

  /**
   * Get user's position in the tree
   */
  getUserPosition(userId: string): TreeNode | null {
    for (const node of this.tree.values()) {
      if (node.userId === userId) {
        return node;
      }
    }
    return null;
  }

  /**
   * Get all downline members (descendants) of a user
   */
  getDownline(userId: string): TreeNode[] {
    const userNode = this.getUserPosition(userId);
    if (!userNode) return [];

    const downline: TreeNode[] = [];
    const queue: string[] = [userNode.id];

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      const currentNode = this.tree.get(currentNodeId);
      
      if (!currentNode) continue;

      // Add children to downline (excluding the root user)
      if (currentNode.id !== userNode.id) {
        downline.push(currentNode);
      }

      // Add children to queue
      if (currentNode.leftChildId) {
        queue.push(currentNode.leftChildId);
      }
      if (currentNode.rightChildId) {
        queue.push(currentNode.rightChildId);
      }
    }

    return downline;
  }

  /**
   * Get upline members (ancestors) of a user
   */
  getUpline(userId: string): TreeNode[] {
    const userNode = this.getUserPosition(userId);
    if (!userNode) return [];

    const upline: TreeNode[] = [];
    let currentNode = userNode;

    while (currentNode.parentId) {
      const parent = this.tree.get(currentNode.parentId);
      if (parent) {
        upline.push(parent);
        currentNode = parent;
      } else {
        break;
      }
    }

    return upline;
  }

  /**
   * Get direct children of a user
   */
  getDirectChildren(userId: string): { left: TreeNode | null; right: TreeNode | null } {
    const userNode = this.getUserPosition(userId);
    if (!userNode) {
      return { left: null, right: null };
    }

    const left = userNode.leftChildId ? this.tree.get(userNode.leftChildId) || null : null;
    const right = userNode.rightChildId ? this.tree.get(userNode.rightChildId) || null : null;

    return { left, right };
  }

  /**
   * Get tree statistics for a user
   */
  getTreeStats(userId: string): {
    totalDownline: number;
    leftSideCount: number;
    rightSideCount: number;
    directReferrals: number;
    maxDepth: number;
  } {
    const userNode = this.getUserPosition(userId);
    if (!userNode) {
      return {
        totalDownline: 0,
        leftSideCount: 0,
        rightSideCount: 0,
        directReferrals: 0,
        maxDepth: 0
      };
    }

    const downline = this.getDownline(userId);
    const { left, right } = this.getDirectChildren(userId);
    
    const leftSideCount = left ? this.getDownline(left.userId).length + 1 : 0;
    const rightSideCount = right ? this.getDownline(right.userId).length + 1 : 0;
    
    const directReferrals = (left ? 1 : 0) + (right ? 1 : 0);
    
    // Calculate max depth
    const maxDepth = this.calculateMaxDepth(userNode.id);

    return {
      totalDownline: downline.length,
      leftSideCount,
      rightSideCount,
      directReferrals,
      maxDepth
    };
  }

  /**
   * Calculate maximum depth from a node
   */
  private calculateMaxDepth(nodeId: string): number {
    const node = this.tree.get(nodeId);
    if (!node) return 0;

    const leftDepth = node.leftChildId ? this.calculateMaxDepth(node.leftChildId) : 0;
    const rightDepth = node.rightChildId ? this.calculateMaxDepth(node.rightChildId) : 0;

    return 1 + Math.max(leftDepth, rightDepth);
  }

  /**
   * Find node by sponsorship number
   */
  private findNodeBySponsorshipNumber(sponsorshipNumber: string): TreeNode | null {
    for (const node of this.tree.values()) {
      if (node.sponsorshipNumber === sponsorshipNumber) {
        return node;
      }
    }
    return null;
  }

  /**
   * Generate unique node ID
   */
  private generateNodeId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate tree structure integrity
   */
  validateTreeIntegrity(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const node of this.tree.values()) {
      // Check parent-child relationships
      if (node.parentId) {
        const parent = this.tree.get(node.parentId);
        if (!parent) {
          errors.push(`Node ${node.id} has invalid parent reference`);
        } else {
          const isLeftChild = parent.leftChildId === node.id;
          const isRightChild = parent.rightChildId === node.id;
          
          if (!isLeftChild && !isRightChild) {
            errors.push(`Node ${node.id} is not properly linked to parent ${parent.id}`);
          }
        }
      }

      // Check child references
      if (node.leftChildId) {
        const leftChild = this.tree.get(node.leftChildId);
        if (!leftChild || leftChild.parentId !== node.id) {
          errors.push(`Node ${node.id} has invalid left child reference`);
        }
      }

      if (node.rightChildId) {
        const rightChild = this.tree.get(node.rightChildId);
        if (!rightChild || rightChild.parentId !== node.id) {
          errors.push(`Node ${node.id} has invalid right child reference`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get tree visualization data for rendering
   */
  getTreeVisualization(rootUserId: string): any {
    const rootNode = this.getUserPosition(rootUserId);
    if (!rootNode) return null;

    const buildTreeData = (nodeId: string): any => {
      const node = this.tree.get(nodeId);
      if (!node) return null;

      return {
        id: node.id,
        userId: node.userId,
        name: node.userData ? `${node.userData.firstName} ${node.userData.lastName}` : 'Unknown',
        sponsorshipNumber: node.sponsorshipNumber,
        level: node.level,
        position: node.position,
        children: [
          node.leftChildId ? buildTreeData(node.leftChildId) : null,
          node.rightChildId ? buildTreeData(node.rightChildId) : null
        ].filter(Boolean)
      };
    };

    return buildTreeData(rootNode.id);
  }
}

/**
 * Helper function to simulate tree placement for testing
 */
export const simulateTreePlacement = (sponsorId: string, newUsers: string[]): PlacementResult[] => {
  const tree = new BinaryTreeManager();
  
  // Add root user (sponsor)
  tree.addUser('root-user', sponsorId, '', { firstName: 'Root', lastName: 'User' });
  
  const results: PlacementResult[] = [];
  
  newUsers.forEach((userId, index) => {
    const result = tree.addUser(
      userId,
      `SP${String(index + 1).padStart(8, '0')}`,
      sponsorId,
      { firstName: `User`, lastName: `${index + 1}` }
    );
    results.push(result);
  });

  return results;
};