/**
 * PS-23 Academic Benchmark Sample Codes
 * Self-contained sample code strings used for demo populating and testing.
 */

export const SAMPLE_PYTHON_ALICE = `"""
Fibonacci calculation using recursive memoization.
Author: Alice Miller
Assignment: CS101 Dynamic Programming
"""

def fibonacci_memo(n, memo=None):
    if memo is None:
        memo = {}
    if n in memo:
        return memo[n]
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    
    # Recursive step with memo storage
    memo[n] = fibonacci_memo(n - 1, memo) + fibonacci_memo(n - 2, memo)
    return memo[n]

def run_suite():
    test_cases = [0, 1, 5, 10, 20, 30]
    for val in test_cases:
        res = fibonacci_memo(val)
        print(f"Fibonacci({val}) = {res}")

if __name__ == "__main__":
    run_suite()
`;

export const SAMPLE_PYTHON_BOB = `"""
CS101 Lab - Homework 3
Implementation of fast fibonacci series
"""

def compute_fib(num, cache=None):
    if cache is None:
        cache = {}
    if num in cache:
        return cache[num]
    if num <= 0:
        return 0
    elif num == 1:
        return 1
    
    # Save computed result to dictionary
    cache[num] = compute_fib(num - 1, cache) + compute_fib(num - 2, cache)
    return cache[num]

def main():
    inputs = [0, 1, 5, 10, 20, 30]
    for item in inputs:
        ans = compute_fib(item)
        print(f"Fibonacci({item}) = {ans}")

if __name__ == "__main__":
    main()
`;

export const SAMPLE_PYTHON_CHARLIE = `"""
Dijkstra's Shortest Path Algorithm
Author: Charlie Tang
Assignment: CS101 Graph Algorithms
"""
import heapq

def dijkstra(graph, start_vertex):
    distances = {vertex: float('infinity') for vertex in graph}
    distances[start_vertex] = 0
    pq = [(0, start_vertex)]
    visited = set()

    while pq:
        current_distance, current_vertex = heapq.heappop(pq)
        if current_vertex in visited:
            continue
        visited.add(current_vertex)

        for neighbor, weight in graph[current_vertex].items():
            distance = current_distance + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(pq, (distance, neighbor))

    return distances

def demo():
    graph = {
        'A': {'B': 4, 'C': 2},
        'B': {'A': 4, 'C': 1, 'D': 5},
        'C': {'A': 2, 'B': 1, 'D': 8},
        'D': {'B': 5, 'C': 8}
    }
    print("Shortest routes:", dijkstra(graph, 'A'))

if __name__ == "__main__":
    demo()
`;

export const SAMPLE_JAVA_EVAN = `/**
 * Binary Search Tree Implementation
 * CS201 Data Structures
 * Author: Evan Lewis
 */
public class BinarySearchTree {
    static class Node {
        int key;
        Node left, right;

        public Node(int item) {
            key = item;
            left = right = null;
        }
    }

    private Node root;

    public BinarySearchTree() {
        root = null;
    }

    public void insert(int key) {
        root = insertRec(root, key);
    }

    private Node insertRec(Node root, int key) {
        if (root == null) {
            root = new Node(key);
            return root;
        }
        if (key < root.key) {
            root.left = insertRec(root.left, key);
        } else if (key > root.key) {
            root.right = insertRec(root.right, key);
        }
        return root;
    }

    public boolean search(int key) {
        return searchRec(root, key);
    }

    private boolean searchRec(Node root, int key) {
        if (root == null) return false;
        if (root.key == key) return true;
        if (root.key > key) return searchRec(root.left, key);
        return searchRec(root.right, key);
    }
}
`;

export const SAMPLE_JAVA_FIONA = `/**
 * Custom BST Tree representation
 * Assignment 4 - Data Structures
 */
public class BSTree {
    static class TreeNode {
        int data;
        TreeNode leftChild;
        TreeNode rightChild;

        public TreeNode(int val) {
            data = val;
            leftChild = null;
            rightChild = null;
        }
    }

    private TreeNode mRoot;

    public BSTree() {
        mRoot = null;
    }

    public void add(int val) {
        mRoot = addHelper(mRoot, val);
    }

    private TreeNode addHelper(TreeNode current, int val) {
        if (current == null) {
            current = new TreeNode(val);
            return current;
        }
        if (val < current.data) {
            current.leftChild = addHelper(current.leftChild, val);
        } else if (val > current.data) {
            current.rightChild = addHelper(current.rightChild, val);
        }
        return current;
    }

    public boolean contains(int val) {
        return containsHelper(mRoot, val);
    }

    private boolean containsHelper(TreeNode current, int val) {
        if (current == null) return false;
        if (current.data == val) return true;
        if (current.data > val) return containsHelper(current.leftChild, val);
        return containsHelper(current.rightChild, val);
    }
}
`;
