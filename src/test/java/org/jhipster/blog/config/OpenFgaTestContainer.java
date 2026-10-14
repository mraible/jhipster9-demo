package org.jhipster.blog.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistrar;
import org.testcontainers.openfga.OpenFGAContainer;

@TestConfiguration(proxyBeanMethods = false)
public class OpenFgaTestContainer {

    @Bean(destroyMethod = "stop")
    public OpenFGAContainer openFgaContainer() {
        OpenFGAContainer container = new OpenFGAContainer("openfga/openfga:v1.22.0");
        container.start();
        return container;
    }

    @Bean
    public DynamicPropertyRegistrar openFgaProperties(OpenFGAContainer openFgaContainer) {
        return registry -> registry.add("openfga.api-url", openFgaContainer::getHttpEndpoint);
    }
}
