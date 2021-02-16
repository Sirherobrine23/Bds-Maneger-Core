const si = require("systeminformation");
module.exports.current_cpu = undefined
module.exports.ram_free = undefined
module.exports.ram_total = undefined
module.exports.cpu_speed = undefined
module.exports.bds_cpu = undefined
module.exports.bds_ram = undefined
// module.exports.system = si

function init_1(){
    si.cpu().then(data => {
        module.exports.cpu_speed = Math.trunc(data.speed)
    })
    si.mem().then(data => {
        module.exports.ram_free = Math.trunc(data.free / 1024 / 1024 / 1024)
        module.exports.ram_total = Math.trunc(data.total / 1024 / 1024 / 1024)
    })
    si.currentLoad().then(data => {
        module.exports.current_cpu = Math.trunc(data.currentLoad)
    })
}

function init_2(){
    si.processes().then(data => {
        const list = data.list
        for (let pid in list) {
            var coomand = list[pid].command
            if (coomand.includes("bedrock_server", "bedrock_server.exe", "server.jar")){
                module.exports.bds_cpu = Math.trunc(list[pid].cpu)
                module.exports.bds_ram = Math.trunc(list[pid].mem)
            } else {
                pid++
            }
        }
    })
}

init_1()
init_2()
setInterval(() => {
    init_1()
    init_2()
}, 3000);
