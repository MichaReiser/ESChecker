import assert from "assert";
import Node from "./node";
import Edge from "./edge";

export const BRANCHES = {
	TRUE: "True",
	FALSE: "False",
	UNCONDITIONAL: "Unconditional"
};

export class ControlFlowGraph {
	constructor() {
		this._nodes = new Map();
	}

	/**
	 * Returns all nodes of this graph
	 * @returns {Iterator.<Node>} an iterator over all nodes.
     */
	getNodes() {
		return this._nodes.values();
	}

	/**
	 * Returns the existing node for the given value or undefined if no node for the given value exists.
	 * @param value the value for which the node should be resolved
	 * @returns {Node} the node that wrapps the value or undefined if no node for the given value exists.
     */
	getNode(value) {
		return this._nodes.get(value);
	}

	/**
	 * Creates a new node for the given value or returns the existing node for the given value.
	 * @param value the value that should be added to the graph
	 * @returns {Node} the created or existing node
     */
	createNode(value) {
		const existing = this._nodes.get(value);
		if (existing) {
			return existing;
		}

		const graphNode = new Node(value);
		this._nodes.set(value, graphNode);

		return graphNode;
	}

	/**
	 * Creates a connection between the from and to value. If from or to are a value and no node exists
	 * for the given value, then a new node is created.
	 * @param from {Node|*} the node from which the directed connection should be created or the value
	 * @param branch {*} the label that should be added to the edge
     * @param to {Node|*} the node to which the directed connection should be created or the value.
     */
	connectIfNotFound(from, branch, to) {
		const fromGraphNode = this._getNodeFromValueOrNode(from);
		const toGraphNode = this._getNodeFromValueOrNode(to);

		if (!this.isConnected(fromGraphNode, toGraphNode, branch)) {
			const edge = new Edge(fromGraphNode, branch, toGraphNode);
			fromGraphNode.successors.add(edge);
			toGraphNode.predecessors.add(edge);
		}
	}

	/**
	 * Indicator if a connection from the 'from' value to the 'to' value exists (if to is a successor of to) for the given branch.
	 * @param from {Node|*} the from value or node
	 * @param to {Node|*} the to value or node
	 * @param branch {*?} the required label between the from and to node. If absent, then the branch label is not checked.
     * @returns {boolean} true if an edge from the 'from' value to the 'to' value exists (with the given branch, if present)
     */
	isConnected(from, to, branch) {
		const fromGraphNode = this._getNodeFromValueOrNode(from);
		const toGraphNode = this._getNodeFromValueOrNode(to);

		return toGraphNode.isSuccessorOf(fromGraphNode, branch);
	}

	_getNodeFromValueOrNode(valueOrGraphNode) {
		if (valueOrGraphNode instanceof Node) {
			return valueOrGraphNode;
		}
		const graphNode = this.createNode(valueOrGraphNode);

		assert(graphNode, "The node for the given value node doesn't exist");
		return graphNode;
	}
}



export default ControlFlowGraph;