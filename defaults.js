module.exports = {
    Image: "busybox",
    Memory: 1024 * 1024 * 64,
    MemorySwap: -1,     // disables swap
    CpuShares: 512,     // This means, approximately, that it has half priority
    Cpuset: "0",        // This means only allow running on the first CPU core
    SecurityOpts: [],   // figure these out
    Capdrop: [          // this drops all privileges that are enabled in Docker by default
        "CHOWN",
        "DAC_OVERRIDE",
        "FSETID",
        "FOWNER",
        "MKNOD",
        "NET_RAW",
        "SETGID",
        "SETUID",
        "SETFCAP",
        "SETPCAP",
        "NET_BIND_SERVICE",
        "SYS_CHROOT",
        "KILL",
        "AUDIT_WRITE",
    ],
    HostConfig: {
        Links: [],
        LogConfig: {
            Type: 'syslog',
            Config: null,
        }
    },
    ExposedPorts:  {  }, // placeholder to make mix-ins easier
    Env: [ ],            // placeholder to make mix-ins easier
    Labels: { }          // placeholder to make mix-ins easier
}
