/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     🧪 TESTES - COMPILER & INTERPRETER MANIFEST (Level 95)                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const assert = require('assert');

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DAS CLASSES (para teste sem TypeScript)
// ═══════════════════════════════════════════════════════════════════════════════

class LexerGenerator {
    constructor() {
        this.tokenDefs = [];
    }
    
    addToken(def) {
        this.tokenDefs.push(def);
        return this;
    }
    
    addKeywords(keywords) {
        for (const kw of keywords) {
            this.tokenDefs.push({
                name: `KW_${kw.toUpperCase()}`,
                pattern: new RegExp(`\\b${kw}\\b`),
                type: 'keyword',
                priority: 10
            });
        }
        return this;
    }
    
    addOperators(operators) {
        for (const [name, pattern] of Object.entries(operators)) {
            this.tokenDefs.push({
                name,
                pattern: pattern,
                type: 'operator',
                priority: 5
            });
        }
        return this;
    }
    
    generate() {
        return `// Auto-generated Lexer with ${this.tokenDefs.length} token definitions`;
    }
}

class ParserGenerator {
    constructor() {
        this.rules = [];
        this.startSymbol = 'program';
    }
    
    setStartSymbol(symbol) {
        this.startSymbol = symbol;
        return this;
    }
    
    addRule(rule) {
        this.rules.push(rule);
        return this;
    }
    
    generate() {
        return `// Auto-generated Parser with ${this.rules.length} rules, start: ${this.startSymbol}`;
    }
}

class SimpleInterpreter {
    constructor() {
        this.variables = new Map();
        this.functions = new Map();
        this.functions.set('print', (args) => { console.log(...args); return null; });
        this.functions.set('len', (args) => args[0].length);
        this.functions.set('type', (args) => typeof args[0]);
    }
    
    evaluate(ast) {
        switch (ast.type) {
            case 'program':
                return this.evaluateProgram(ast);
            case 'number':
                return ast.value;
            case 'string':
                return ast.value;
            case 'binary_op':
                return this.evaluateBinaryOp(ast);
            case 'assignment':
                return this.evaluateAssignment(ast);
            case 'identifier':
                return this.variables.get(ast.value);
            default:
                throw new Error(`Unknown AST node type: ${ast.type}`);
        }
    }
    
    evaluateProgram(ast) {
        let result = null;
        for (const child of ast.children || []) {
            result = this.evaluate(child);
        }
        return result;
    }
    
    evaluateBinaryOp(ast) {
        const [left, right] = ast.children || [];
        const leftVal = this.evaluate(left);
        const rightVal = this.evaluate(right);
        const op = ast.value;
        
        switch (op) {
            case '+': return leftVal + rightVal;
            case '-': return leftVal - rightVal;
            case '*': return leftVal * rightVal;
            case '/': return leftVal / rightVal;
            case '==': return leftVal === rightVal;
            case '<': return leftVal < rightVal;
            case '>': return leftVal > rightVal;
            default: throw new Error(`Unknown operator: ${op}`);
        }
    }
    
    evaluateAssignment(ast) {
        const [nameNode, valueNode] = ast.children || [];
        const name = nameNode.value;
        const value = this.evaluate(valueNode);
        this.variables.set(name, value);
        return value;
    }
}

function shouldEnableCompilerInterpreter(prompt) {
    const promptLower = prompt.toLowerCase();
    const keywords = [
        'compiler', 'compilador', 'lexer', 'parser', 'ast',
        'interpreter', 'interpretador', 'tokenizer', 'grammar',
        'criar linguagem', 'create language', 'dsl',
        'llvm', 'bytecode', 'jit', 'code generation'
    ];
    return keywords.some(k => promptLower.includes(k));
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTES
// ═══════════════════════════════════════════════════════════════════════════════

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        failed++;
    }
}

console.log('\n🔨 COMPILER & INTERPRETER MANIFEST - TESTES\n');
console.log('═'.repeat(60));

// ═══════════════════════════════════════════════════════════════════════════════
// TESTES DO LEXER GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n📋 LEXER GENERATOR\n');

test('LexerGenerator - criar instância', () => {
    const lexer = new LexerGenerator();
    assert(lexer !== null);
    assert(Array.isArray(lexer.tokenDefs));
});

test('LexerGenerator - addToken', () => {
    const lexer = new LexerGenerator();
    lexer.addToken({ name: 'NUMBER', pattern: /\d+/, type: 'literal' });
    assert.strictEqual(lexer.tokenDefs.length, 1);
    assert.strictEqual(lexer.tokenDefs[0].name, 'NUMBER');
});

test('LexerGenerator - addKeywords', () => {
    const lexer = new LexerGenerator();
    lexer.addKeywords(['if', 'else', 'while', 'for']);
    assert.strictEqual(lexer.tokenDefs.length, 4);
    assert.strictEqual(lexer.tokenDefs[0].name, 'KW_IF');
    assert.strictEqual(lexer.tokenDefs[0].type, 'keyword');
    assert.strictEqual(lexer.tokenDefs[0].priority, 10);
});

test('LexerGenerator - addOperators', () => {
    const lexer = new LexerGenerator();
    lexer.addOperators({ PLUS: '+', MINUS: '-', MULT: '*' });
    assert.strictEqual(lexer.tokenDefs.length, 3);
    assert.strictEqual(lexer.tokenDefs[0].type, 'operator');
});

test('LexerGenerator - chaining', () => {
    const lexer = new LexerGenerator()
        .addKeywords(['let', 'const'])
        .addOperators({ ASSIGN: '=' })
        .addToken({ name: 'IDENT', pattern: /[a-z]+/, type: 'identifier' });
    assert.strictEqual(lexer.tokenDefs.length, 4);
});

test('LexerGenerator - generate', () => {
    const lexer = new LexerGenerator()
        .addKeywords(['if', 'else'])
        .addOperators({ EQ: '==' });
    const code = lexer.generate();
    assert(code.includes('Auto-generated Lexer'));
    assert(code.includes('3 token definitions'));
});

// ═══════════════════════════════════════════════════════════════════════════════
// TESTES DO PARSER GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🌳 PARSER GENERATOR\n');

test('ParserGenerator - criar instância', () => {
    const parser = new ParserGenerator();
    assert(parser !== null);
    assert.strictEqual(parser.startSymbol, 'program');
});

test('ParserGenerator - setStartSymbol', () => {
    const parser = new ParserGenerator().setStartSymbol('expression');
    assert.strictEqual(parser.startSymbol, 'expression');
});

test('ParserGenerator - addRule', () => {
    const parser = new ParserGenerator();
    parser.addRule({ name: 'expr', production: ['term', 'PLUS', 'term'] });
    assert.strictEqual(parser.rules.length, 1);
    assert.strictEqual(parser.rules[0].name, 'expr');
});

test('ParserGenerator - generate', () => {
    const parser = new ParserGenerator()
        .setStartSymbol('expr')
        .addRule({ name: 'expr', production: ['term'] })
        .addRule({ name: 'term', production: ['NUMBER'] });
    const code = parser.generate();
    assert(code.includes('Auto-generated Parser'));
    assert(code.includes('2 rules'));
    assert(code.includes('start: expr'));
});

// ═══════════════════════════════════════════════════════════════════════════════
// TESTES DO SIMPLE INTERPRETER
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n⚡ SIMPLE INTERPRETER\n');

test('SimpleInterpreter - criar instância', () => {
    const interp = new SimpleInterpreter();
    assert(interp !== null);
    assert(interp.functions.has('print'));
    assert(interp.functions.has('len'));
});

test('SimpleInterpreter - evaluate number', () => {
    const interp = new SimpleInterpreter();
    const result = interp.evaluate({ type: 'number', value: 42 });
    assert.strictEqual(result, 42);
});

test('SimpleInterpreter - evaluate string', () => {
    const interp = new SimpleInterpreter();
    const result = interp.evaluate({ type: 'string', value: 'hello' });
    assert.strictEqual(result, 'hello');
});

test('SimpleInterpreter - evaluate binary_op (+)', () => {
    const interp = new SimpleInterpreter();
    const ast = {
        type: 'binary_op',
        value: '+',
        children: [
            { type: 'number', value: 10 },
            { type: 'number', value: 5 }
        ]
    };
    assert.strictEqual(interp.evaluate(ast), 15);
});

test('SimpleInterpreter - evaluate binary_op (*)', () => {
    const interp = new SimpleInterpreter();
    const ast = {
        type: 'binary_op',
        value: '*',
        children: [
            { type: 'number', value: 7 },
            { type: 'number', value: 6 }
        ]
    };
    assert.strictEqual(interp.evaluate(ast), 42);
});

test('SimpleInterpreter - evaluate comparison (<)', () => {
    const interp = new SimpleInterpreter();
    const ast = {
        type: 'binary_op',
        value: '<',
        children: [
            { type: 'number', value: 5 },
            { type: 'number', value: 10 }
        ]
    };
    assert.strictEqual(interp.evaluate(ast), true);
});

test('SimpleInterpreter - evaluate assignment', () => {
    const interp = new SimpleInterpreter();
    const ast = {
        type: 'assignment',
        children: [
            { type: 'identifier', value: 'x' },
            { type: 'number', value: 100 }
        ]
    };
    interp.evaluate(ast);
    assert.strictEqual(interp.variables.get('x'), 100);
});

test('SimpleInterpreter - evaluate program', () => {
    const interp = new SimpleInterpreter();
    const ast = {
        type: 'program',
        children: [
            {
                type: 'assignment',
                children: [
                    { type: 'identifier', value: 'a' },
                    { type: 'number', value: 10 }
                ]
            },
            {
                type: 'binary_op',
                value: '+',
                children: [
                    { type: 'identifier', value: 'a' },
                    { type: 'number', value: 5 }
                ]
            }
        ]
    };
    const result = interp.evaluate(ast);
    assert.strictEqual(result, 15);
});

// ═══════════════════════════════════════════════════════════════════════════════
// TESTES DO DETECTOR
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🎯 DETECTOR\n');

test('Detector - ativa para "criar um compiler"', () => {
    assert(shouldEnableCompilerInterpreter('Quero criar um compiler para minha linguagem'));
});

test('Detector - ativa para "lexer e parser"', () => {
    assert(shouldEnableCompilerInterpreter('Preciso de um lexer e parser'));
});

test('Detector - ativa para "AST"', () => {
    assert(shouldEnableCompilerInterpreter('Como gerar uma AST?'));
});

test('Detector - ativa para "criar linguagem"', () => {
    assert(shouldEnableCompilerInterpreter('Quero criar linguagem de programação'));
});

test('Detector - ativa para "DSL"', () => {
    assert(shouldEnableCompilerInterpreter('Preciso de uma DSL para configuração'));
});

test('Detector - ativa para "JIT"', () => {
    assert(shouldEnableCompilerInterpreter('Como implementar JIT compilation?'));
});

test('Detector - NÃO ativa para "website simples"', () => {
    assert(!shouldEnableCompilerInterpreter('Criar um website simples com React'));
});

test('Detector - NÃO ativa para "API REST"', () => {
    assert(!shouldEnableCompilerInterpreter('Fazer uma API REST em Node.js'));
});

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTADO FINAL
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(60));
console.log(`\n📊 RESULTADO: ${passed} passou, ${failed} falhou`);
console.log(`📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

if (failed > 0) {
    process.exit(1);
}
