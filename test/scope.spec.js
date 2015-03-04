/* jshint globalstrict: true */
/* jshint jasmine: true */
/* global Scope: false */
/* global _: false */

'use strict';

describe('Scope', function() {
    it('can be constructed and used as an object', function() {
        var scope = new Scope();
        scope.aProperty = 1;

        expect(scope.aProperty).toBe(1);
    });

    describe('digest', function() {

        var scope;

        beforeEach(function() {
            scope = new Scope();
        });

        // Watching Object Properties: $watch And $digest
        // p6
        // --------------------------------------------------------------------------------

        it('calls the listener function of a watch on first $digest', function() {
            var watchFn = function() {
                return 'watch';
            };
            var listenerFn = jasmine.createSpy();

            scope.$watch(watchFn, listenerFn);
            scope.$digest();

            expect(listenerFn).toHaveBeenCalled();
        });

        // Checking for Dirty Values
        // p9
        // --------------------------------------------------------------------------------

        it('calls the watch function with the scope as the argument', function() {
            var watchFn = jasmine.createSpy();
            var listenerFn = function() {
            };

            scope.$watch(watchFn, listenerFn);
            scope.$digest();

            expect(watchFn).toHaveBeenCalledWith(scope);
        });

        it('calls the listener function when the watched value changes', function() {
            scope.someValue = 'a';
            scope.counter = 0;

            scope.$watch(
                function(scope) {
                    return scope.someValue;
                },
                function(newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            expect(scope.counter).toBe(0);

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.someValue = 'b';
            expect(scope.counter).toBe(1);

            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it('calls listener when watch value is first undefined', function() {
            scope.counter = 0;

            scope.$watch(
                function(scope) {
                    return scope.someValue;
                },
                function(newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        // Initializing Watch Values
        // p11
        // --------------------------------------------------------------------------------

        it('calls listener with new value as old value the first time', function() {
            scope.someValue = 123;
            var oldValueGiven;

            scope.$watch(
                function(scope) {
                    return scope.someValue;
                },
                function(newValue, oldValue, scope) {
                    oldValueGiven = oldValue;
                }
            );

            scope.$digest();
            expect(oldValueGiven).toBe(123);
        });

        // Getting Notified Of Digests
        // p13
        // --------------------------------------------------------------------------------

        it('may have watchers that omit the listener function', function() {
            var watchFn = jasmine.createSpy().and.returnValue('something');
            scope.$watch(watchFn);

            scope.$digest();
            expect(watchFn).toHaveBeenCalled();
        });

        // Keep Digesting While Dirty
        // p14
        // --------------------------------------------------------------------------------

        it('triggers chained watchers in the same digest', function() {
            scope.name = 'Vic';

            scope.$watch(
                function(scope) {
                    return scope.nameUpper;
                },
                function(newValue, oldValue, scope) {
                    if (newValue) {
                        scope.initial = newValue.substr(0, 1) + '.';
                    }
                }
            );

            scope.$watch(
                function(scope) {
                    return scope.name;
                },
                function(newValue, oldValue, scope) {
                    if (newValue) {
                        scope.nameUpper = newValue.toUpperCase();
                    }
                }
            );

            scope.$digest();
            expect(scope.initial).toBe('V.');
            expect(scope.nameUpper).toBe('VIC');

            scope.name = 'Bob';
            scope.$digest();
            expect(scope.initial).toBe('B.');
            expect(scope.nameUpper).toBe('BOB');
        });

        // Giving Up On An Unstable Digest
        // p16
        // --------------------------------------------------------------------------------

        it('gives up on the watches after 10 iterations', function() {
            scope.counterA = 0;
            scope.counterB = 0;

            scope.$watch(
                function(scope) {
                    return scope.counterA;
                },
                function(newValue, oldValue, scope) {
                    scope.counterB++;
                }
            );

            scope.$watch(
                function(scope) {
                    return scope.counterB;
                },
                function(newValue, oldValue, scope) {
                    scope.counterA++;
                }
            );

            expect( (function() { scope.$digest(); })).toThrow();
        });

        // Short-Circuiting The Digest When The Last Watch Is Clean
        // p18
        // --------------------------------------------------------------------------------

        it('ends the digest when the last watch is clean', function() {
            scope.array = _.range(100);
            var watchExecutions = 0;

            _.times(100, function(i) {
                scope.$watch(
                    function(scope) {
                        watchExecutions++;
                        return scope.array[i];
                    },
                    function(newValue, oldValue, scope) {

                    }
                );
            });

            scope.$digest();
            expect(watchExecutions).toBe(200);

            scope.array[0] = 999;
            scope.$digest();
            expect(watchExecutions).toBe(301);
        });

        it('does not end digest so that new watches are not run', function() {
            scope.aValue = 'abc';
            scope.counter = 0;

            scope.$watch(
                function(scope) {
                    return scope.aValue;
                },
                function(newValue, oldValue, scope) {
                    // Adding another watch in this listener
                    scope.$watch(
                        function(scope) {
                            return scope.aValue;
                        },
                        function(newValue, oldValue, scope) {
                            scope.counter++;
                        }
                    );
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

        });

        // Value-based dirty-checking
        // p21
        // --------------------------------------------------------------------------------

        // Note that Angular does not do value based dirty checking by default!
        it('compares based on value if enabled', function() {
            scope.aValue = [1, 2, 3];
            scope.counter = 0;

            scope.$watch(
                function(scope) {
                    return scope.aValue;
                },
                function(newValue, oldValue, scope) {
                    scope.counter++;
                },
                true
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.aValue.push(4);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        // NaNs
        // p24
        // --------------------------------------------------------------------------------

        it('correctly handles NaNs', function() {
            scope.number = 0/0; // NaN
            scope.counter = 0;

            scope.$watch(
                function(scope) {
                    return scope.number;
                },
                function(newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        // $eval - Evaluating Code In The Context of A Scope
        // p25
        // --------------------------------------------------------------------------------

        it("executes $eval'ed function and returns result", function() {
            scope.aValue = 99;

            var result = scope.$eval(function(scope) {
                return scope.aValue;
            });

            expect(result).toBe(99);
        });

        it('passes the second eval argument straight through', function() {
            scope.aValue = 99;

            var funcToEval = function(scope, arg) {
                return scope.aValue + arg;
            };

            var result = scope.$eval(funcToEval, 1);
            expect(result).toBe(100);
        });

        // $apply - Integrating External Code With The Digest Cycle
        // p26
        // --------------------------------------------------------------------------------

        it("it executes $apply'ed function and starts the digest", function() {
            scope.aValue = 'blah';
            scope.counter = 0;

            scope.$watch(
                function(scope) {
                    return scope.aValue;
                },
                function(newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.$apply(function(scope) {
                scope.aValue = 'blast';
            });
            expect(scope.counter).toBe(2);
        });

        // $evalAsync - Deferred Execution
        // p27
        // --------------------------------------------------------------------------------

        it('executes $evalAsynced function later in the same cycle', function() {
            scope.aValue = [1, 2, 3];
            scope.asyncEvaluated = false;
            scope.asyncEvaluatedImmeadiately = false;

            scope.$watch(
                function(scope) {
                    return scope.aValue;
                },
                function(newValue, oldValue, scope) {
                    scope.$evalAsync(function(scope) {
                        scope.asyncEvaluated = true;
                    });
                    scope.asyncEvaluatedImmeadiately = scope.asyncEvaluated;
                }
            );

            scope.$digest();
            expect(scope.asyncEvaluated).toBe(true);
            expect(scope.asyncEvaluatedImmeadiately).toBe(false);
        });

        // Scheduling $evalAysnc from Watch Functions
        // p29
        // --------------------------------------------------------------------------------

        it('executes $evalAsynced functions added by watch functions', function() {
            scope.aValue = [1, 2, 3];
            scope.asyncEvaluated = false;

            scope.$watch(
                function(scope) {
                    if(!scope.asyncEvaluated) {
                        scope.$evalAsync(function(scope) {
                            scope.asyncEvaluated = true;
                        });
                    }
                    return scope.aValue;
                },
                function(newValue, oldValue, scope) {
                }
            );

            scope.$digest();
            expect(scope.asyncEvaluated).toBe(true);
        });

        it('executes $evalAsynced functions even when not dirty', function() {
            scope.aValue = [1, 2, 3];
            scope.asyncEvaluatedTimes = 0;

            scope.$watch(
                function(scope) {
                    if(scope.asyncEvaluatedTimes < 2) {
                        scope.$evalAsync(function(scope) {
                            scope.asyncEvaluatedTimes++;
                        });
                    }
                    return scope.aValue;
                },
                function(newValue, oldValue, scope) {
                }
            );

            scope.$digest();
            expect(scope.asyncEvaluatedTimes).toBe(2);
        });

        it('eventually halts $evalAsyncs added by watches', function() {
            scope.aValue = [1, 2, 3];

            scope.$watch(
                function(scope) {
                    scope.$evalAsync(function(scope) {});
                    return scope.aValue;
                },
                function(newValue, oldValue, scope) {
                }
            );

            expect(function() { scope.$digest(); }).toThrow();
        });

        // Scope Phases
        // p32
        // --------------------------------------------------------------------------------
    });

});






















