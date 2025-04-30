use cainome::rs::Abigen;
use std::collections::HashMap;

fn main() {
    // Aliases added from the ABI
    let mut aliases = HashMap::new();
    aliases.insert(
        String::from("escrownet_contract::escrow::escrow_factory::EscrowFactory::Event"),
        String::from("EscrowFactoryEvent"),
    );

    let escrow_abigen =
        Abigen::new("escrow", "./abi/escrow_contract.abi.json").with_types_aliases(aliases).with_derives(vec!["serde::Serialize".to_string(), "serde::Deserialize".to_string()]);

        escrow_abigen
            .generate()
            .expect("Fail to generate bindings")
            .write_to_file("./src/abi/escrow_contract.rs")
            .unwrap();
}