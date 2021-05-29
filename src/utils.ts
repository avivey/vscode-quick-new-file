export function dedupStringArray(input: string[]): string[] {

    function reducer(accumulator: string[], curr: string): string[] {
        if (accumulator[accumulator.length - 1] !== curr) {
            accumulator.push(curr);
        }
        return accumulator;
    }

    return input.reduce(reducer, []);
}
