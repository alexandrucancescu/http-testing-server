
export function copyObjectProps(original: any, props: string[]): any{
	const copy: any = {};
	props.forEach(prop => {
		if(prop in original){
			if(typeof original[prop] === "object" && Object.keys(original[prop]).length===0){
				return;
			}
			copy[prop] = original[prop];
		}
	})
	return copy;
}