
const retry = async (func) => {
    let cond = false;
    while(!cond){
        try {
            await func();
            cond = true;
        } catch (e) {}
    }
}

module.exports ={
    retry
};