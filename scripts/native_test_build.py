Import("env")

# Include test sources in subdirectories
env.Append(PIOTEST_SRC_FILTER=["+<**/*.cpp>"])
