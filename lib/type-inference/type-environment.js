import Immutable from "immutable";
import assert from "assert";

import {Type} from "../semantic-model/types";
import {Symbol} from "../semantic-model/symbol";

/**
 * Representation of a type environement. Maps symbols to theire
 * concrete base type or to a type variable.
 * The structure is implemented as an immutable. Changes to the structures return a new object that reflects the change.
 *
 * @immutable
 */
export class TypeEnvironment {

	/**
	 * Creates a new instance
	 * @param {Immutable.Map} [env=Immutable.Map()] the table that maps the symbols to the types, by default the environment
	 * is initialized with a default mapping.
     */
	constructor(env= new Immutable.Map()) {
		this.mappings = env;
	}

	/**
	 * Indicator if the type environment contains any mappings or not
	 * @returns {boolean} true if the type environment contains no mappings at all.
     */
	get isEmpty() {
		return this.mappings.size === 0;
	}

	/**
	 * Assigns the given symbol the given type
	 * @param {Symbol} symbol the symbol that should be associated with the given type
	 * @param {Type} type the type to associated with the symbol
	 * @returns {TypeEnvironment} the new type environment that includes the mapping from the passed in symbol to the given type.
     */
	setType(symbol, type) {
		assert(symbol instanceof Symbol, "A symbol needs to be specified");
		assert(type instanceof Type, "A type needs to be specified");

		return new TypeEnvironment(this.mappings.set(symbol, type));
	}

	/**
	 * Returns the associrated type for the given symbol
	 * @param {Symbol} symbol the symbol for which the lookup should be performed
	 * @returns {Type} the resolved type for this symbol or undefined if this type environment does not contain a mapping
	 * for the given symbol.
     */
	getType(symbol) {
		assert(symbol, "symbol cannot be undefined or null");
		return this.mappings.get(symbol);
	}

	/**
	 * Returns a boolean indicating whether the type environment contains a mapping from the symbol to a type.
	 * @param {Symbol} symbol They symbol to test for precense in the type environment
	 * @returns {boolean} true if a mapping from the given symbol to a type exists
     */
	hasType(symbol) {
		return this.mappings.has(symbol);
	}

	/**
	 * Substitutes all occurrences of the given old type with the new type.
	 * @param {Type} oldType the old type
	 * @param {Type} newType the new type
	 * @returns {TypeEnvironment} the new type environment where the old type is substituted with the new type
     */
	substitute(oldType, newType) {
		if (oldType === newType) {
			return this;
		}

		const substitutedMappings = this.mappings.withMutations(map => this._substituteInMutable(map, oldType, newType));
		if (this.mappings.equals(substitutedMappings)) {
			return this;
		}

		return new TypeEnvironment(substitutedMappings);
	}

	_substituteInMutable(mutable, oldType, newType) {
		const substitutions = [{oldType, newType }];
		let currentSubstitution;

		while ((currentSubstitution = substitutions.pop())) {
			//noinspection JSAnnotator
			for (const [symbol, type] of mutable) {
				const substituted = type.substitute(currentSubstitution.oldType, currentSubstitution.newType);
				if (substituted !== type) {
					mutable.set(symbol, substituted);

					// the current type has changed, we need to substitute this one too. But only do so if it is not the old type.
					if (type !== currentSubstitution.oldType) {
						substitutions.push({oldType: type, newType: substituted });
					}
				}
			}
		}
	}

	/**
	 * Returns a new type environment that only contains the changed or new mappings since the previous one.
	 * @param {TypeEnvironment} before
	 * @returns {TypeEnvironment} a type environment that represents the difference
     */
	difference(before) {
		const diff = this.mappings.withMutations(map => {
			//noinspection JSAnnotator
			for (const [symbol, type] of map) {
				const typeBefore = before.getType(symbol);
				if (typeBefore && typeBefore.equals(type)) {
					map.delete(symbol);
				}
			}
		});

		if (this.mappings.equals(diff)) {
			return this;
		}

		return new TypeEnvironment(diff);
	}

	/**
	 * Adds the passed in type environment to this type environment.
	 * It adds all missing mappings. It does not change the type of already existing entries in this type environment.
	 * @param {TypeEnvironment} newMappings the type environment that should be added to this type environment
	 * @returns {TypeEnvironment} the type environment that contains the mappings from this and the passed type environment.
     */
	add(newMappings) {
		const mappings = this.mappings.withMutations(map => {
			for (const [symbol, type] of newMappings.mappings) {
				if (!map.has(symbol)) {
					map.set(symbol, type);
				}
			}
		});

		if (this.mappings.equals(mappings)) {
			return this;
		}

		return new TypeEnvironment(mappings);
	}

	/**
	 * Overrides the types for all defined symbols in this type environment with the types from the passed in type environment.
	 * It does not add additional type environments from the new types type environment to this environment.
	 * @param {TypeEnvironment} newTypes type environment containing the new types
	 * @param {Symbol[]} [excludedSymbols] an array of symbols that should not be overriden.
	 * @returns {TypeEnvironment} the updated type environment.
     */
	replaceTypes(newTypes, excludedSymbols) {
		excludedSymbols = new Set(excludedSymbols || []);

		const mappings = this.mappings.withMutations(map => {
			for (const [symbol, type] of this.mappings) {
				if (excludedSymbols.has(symbol)) {
					continue;
				}

				const newType = newTypes.getType(symbol);
				if (newType && !newType.equals(type)) {
					this._substituteInMutable(map, type, newType);
				}
			}
		});

		if (this.mappings.equals(mappings)) {
			return this;
		}

		return new TypeEnvironment(mappings);
	}

	/**
	 * Prints the type environment to the output stream
	 * @param {WriteStream} stream the target stream
	 */
	dump(stream) {
		const sortedMappings = this.mappings.sortBy((value, key) => key);
		sortedMappings.forEach((type, symbol) => {
			stream.write(`${symbol.name} -> ${type}\n`);
		});
	}

	equals(other) {
		return this.mappings.equals(other.mappings);
	}

	hashCode() {
		return this.mappings.hashCode();
	}
}

/**
 * The empty type environment
 * @type {TypeEnvironment}
 */
TypeEnvironment.EMPTY = new TypeEnvironment();

export default TypeEnvironment;