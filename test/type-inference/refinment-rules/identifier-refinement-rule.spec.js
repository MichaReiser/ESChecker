import sinon from "sinon";
import {expect} from "chai";
import * as t from "babel-types";
import {IdentifierRefinementRule} from "../../../lib/type-inference/refinement-rules/identifier-refinement-rule";
import {RefinementContext} from "../../../lib/type-inference/refinment-context";
import {VoidType, NumberType} from "../../../lib/semantic-model/types";
import {SymbolFlags, Symbol} from "../../../lib/semantic-model/symbol";

describe("IdentifierRefinementRule", function () {
	let rule, context;

	beforeEach(function () {
		context = new RefinementContext(null);
		rule = new IdentifierRefinementRule();
	});

	describe("canRefine", function () {
		it("returns true for an identifier", function () {
			// arrange
			const identifier = t.identifier("x");

			// act, assert
			expect(rule.canRefine(identifier)).to.be.true;
		});

		it("returns false for other nodes", function () {
			// arrange
			const stringLiteral = t.stringLiteral("x");

			// act, assert
			expect(rule.canRefine(stringLiteral)).to.be.false;
		});
	});

	describe("refine", function () {
		it("returns UndefinedType for the undefined identifier", function () {
			// arrange
			const undefinedIdentifier = t.identifier("undefined");

			// act, assert
			expect(rule.refine(undefinedIdentifier, context)).to.be.instanceOf(VoidType);
		});

		it("resolves the type from the type environment", function () {
			// arrange
			const identifier = t.identifier("x");
			const type = new NumberType();
			const symbol = new Symbol("x", SymbolFlags.Variable);

			sinon.stub(context, "getSymbol").returns(symbol);
			sinon.stub(context, "getType").returns(type);

			// act
			const refinedType = rule.refine(identifier, context);

			// assert
			sinon.assert.calledWith(context.getSymbol, identifier);
			sinon.assert.calledWith(context.getType, symbol);
			expect(refinedType).to.be.instanceOf(NumberType);
		});

		it("returns a fresh copy of the variable to support cases like `z = null; person.age = z; z = 10;` In this case, z has type number, " +
			"but this should not be reflected to person.age, whose type still needs to be null as this is the most accurate information known about person.age.", function () {
			// arrange
			const identifier = t.identifier("x");
			const type = new NumberType();
			const symbol = new Symbol("x", SymbolFlags.Variable);

			sinon.stub(context, "getSymbol").returns(symbol);
			sinon.stub(context, "getType").returns(type);

			// act
			const refinedType = rule.refine(identifier, context);

			// assert
			expect(refinedType).not.to.equal(type);
		});

		it("throws an error if type of the identifier is not know and therefor the identifier has been used before it's declaration", function () {
			// arrange
			const identifier = t.identifier("x");
			const symbol = new Symbol("x", SymbolFlags.Variable);

			sinon.stub(context, "getSymbol").returns(symbol);
			sinon.stub(context, "getType").returns(undefined);

			// act
			expect(() => rule.refine(identifier, context)).to.throw("Type inference failure: The symbol x is being used before it's declaration");
		});
	});
});