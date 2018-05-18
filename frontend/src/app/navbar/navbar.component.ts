import { AdministrationService } from './../Services/administration.service';
import { ConfigurationService } from 'src/app/Services/configuration.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  public version = '';
  public applicationName = 'OWASP Juice Shop';
  public gitHubRibbon = 'orange';
  public logoSrc = 'assets/public/images/JuiceShop_Logo.svg';

  constructor(private administrationService: AdministrationService,
    private configurationService: ConfigurationService) { }

  ngOnInit() {
    this.administrationService.getApplicationVersion().subscribe((version: any) => {
      if (version) {
        this.version = 'v' + version;
      }
    });

    this.configurationService.getApplicationConfiguration().subscribe((config: any) => {
      if (config && config.application && config.application.name !== null) {
        this.applicationName = config.application.name;
      }
      if (config && config.application && config.application.gitHubRibbon !== null) {
        this.gitHubRibbon = config.application.gitHubRibbon !== 'none' ? config.application.gitHubRibbon : null;
      }

      let logo: string = config.application.logo;

      if (logo.substring(0, 4) === 'http' ) {
        logo = decodeURIComponent(logo.substring(logo.lastIndexOf('/') + 1));
        this.logoSrc = 'assets/public/images/' + logo;
      }
    });

  }

}
